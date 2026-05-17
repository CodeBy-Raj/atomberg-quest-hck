import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Firestore,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Goal, Cycle, ThrustArea, CheckIn, AuditLog } from './types';
import { sendNotification } from './notifications';

export const getUserById = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? (userDoc.data() as User) : null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getGoalsByOwner = async (ownerId: string): Promise<Goal[]> => {
  const q = query(collection(db, 'goals'), where('ownerId', '==', ownerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
};

export const getTeamByManager = async (managerId: string): Promise<User[]> => {
  const q = query(collection(db, 'users'), where('managerId', '==', managerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const createGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date().toISOString();
  const goalRef = await addDoc(collection(db, 'goals'), {
    ...goal,
    createdAt: now,
    updatedAt: now
  });

  await logAudit({
    entity: 'Goal',
    entityId: goalRef.id,
    actorId: goal.ownerId,
    action: 'CREATE',
    before: null,
    after: goal
  });

  return goalRef;
};

export const createSharedGoal = async (
  goalData: Omit<Goal, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'isShared' | 'parentGoalId'>,
  recipientIds: string[],
  creatorId: string
) => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  const parentRef = doc(collection(db, 'goals'));
  const parentGoal = {
    ...goalData,
    id: parentRef.id,
    ownerId: creatorId,
    isShared: true,
    parentGoalId: null,
    status: 'APPROVED',
    createdAt: now,
    updatedAt: now
  };
  batch.set(parentRef, parentGoal);

  recipientIds.forEach(recipientId => {
    const childRef = doc(collection(db, 'goals'));
    batch.set(childRef, {
      ...goalData,
      ownerId: recipientId,
      isShared: false,
      parentGoalId: parentRef.id,
      status: 'DRAFT',
      weightage: 10,
      createdAt: now,
      updatedAt: now
    });
  });

  await batch.commit();
  
  await logAudit({
    entity: 'Goal',
    entityId: parentRef.id,
    actorId: creatorId,
    action: 'BROADCAST',
    before: null,
    after: { parentGoal, recipients: recipientIds }
  });
};

export const updateGoal = async (goalId: string, updates: Partial<Goal>, actorId: string) => {
  const goalRef = doc(db, 'goals', goalId);
  const oldDoc = await getDoc(goalRef);
  const oldData = oldDoc.data() as Goal;

  const isPostLock = oldData.lockedAt !== null;

  await updateDoc(goalRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });

  await logAudit({
    entity: 'Goal',
    entityId: goalId,
    actorId: actorId,
    action: isPostLock ? 'POST_LOCK_UPDATE' : 'UPDATE',
    before: oldData,
    after: { ...oldData, ...updates }
  });
};

export const deleteGoal = async (goalId: string, actorId: string) => {
  const goalRef = doc(db, 'goals', goalId);
  const oldDoc = await getDoc(goalRef);
  
  await deleteDoc(goalRef);

  await logAudit({
    entity: 'Goal',
    entityId: goalId,
    actorId: actorId,
    action: 'DELETE',
    before: oldDoc.data(),
    after: null
  });
};

export const submitGoals = async (goals: Goal[], actorId: string) => {
  const totalWeight = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (totalWeight !== 100) {
    throw new Error(`Invalid total weightage: ${totalWeight}%. Must be exactly 100%.`);
  }

  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const actor = await getUserById(actorId);
  
  for (const goal of goals) {
    if (goal.status === 'DRAFT' || goal.status === 'RETURNED') {
      const goalRef = doc(db, 'goals', goal.id);
      batch.update(goalRef, { 
        status: 'SUBMITTED',
        updatedAt: now
      });

      await logAudit({
        entity: 'Goal',
        entityId: goal.id,
        actorId: actorId,
        action: 'SUBMIT',
        before: goal,
        after: { ...goal, status: 'SUBMITTED' }
      });
    }
  }
  
  // Trigger Notification to Manager
  if (actor?.managerId) {
    const manager = await getUserById(actor.managerId);
    if (manager) {
      sendNotification({
        template: 'GOAL_SUBMITTED',
        to: manager.email,
        recipientName: manager.name,
        vars: { employeeName: actor.name },
        actorId: actorId
      });
    }
  }
  
  return batch.commit();
};

export const approveGoals = async (goals: Goal[], actorId: string) => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  
  for (const goal of goals) {
    const goalRef = doc(db, 'goals', goal.id);
    batch.update(goalRef, { 
      ...goal, 
      status: 'APPROVED',
      lockedAt: now,
      updatedAt: now
    });

    await logAudit({
      entity: 'Goal',
      entityId: goal.id,
      actorId: actorId,
      action: 'APPROVE',
      before: null,
      after: { ...goal, status: 'APPROVED', lockedAt: now }
    });
  }

  // Notify Employee
  if (goals.length > 0) {
    const employee = await getUserById(goals[0].ownerId);
    if (employee) {
      sendNotification({
        template: 'GOAL_APPROVED',
        to: employee.email,
        recipientName: employee.name,
        vars: {},
        actorId: actorId
      });
    }
  }
  
  return batch.commit();
};

export const returnGoals = async (goals: Goal[], comment: string, actorId: string) => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  
  for (const goal of goals) {
    const goalRef = doc(db, 'goals', goal.id);
    batch.update(goalRef, { 
      status: 'RETURNED',
      returnComment: comment,
      updatedAt: now
    });

    await logAudit({
      entity: 'Goal',
      entityId: goal.id,
      actorId: actorId,
      action: 'RETURN',
      before: goal,
      after: { ...goal, status: 'RETURNED', returnComment: comment }
    });
  }

  // Notify Employee
  if (goals.length > 0) {
    const employee = await getUserById(goals[0].ownerId);
    if (employee) {
      sendNotification({
        template: 'GOAL_RETURNED',
        to: employee.email,
        recipientName: employee.name,
        vars: { comment },
        actorId: actorId
      });
    }
  }
  
  return batch.commit();
};

export const getActiveCycle = async (): Promise<Cycle | null> => {
  const q = query(collection(db, 'cycles'), where('isActive', '==', true));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty ? { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Cycle : null;
};

export const getCycles = async (): Promise<Cycle[]> => {
  const querySnapshot = await getDocs(collection(db, 'cycles'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cycle));
};

export const createCycle = async (cycle: Omit<Cycle, 'id'>) => {
  const cycleRef = await addDoc(collection(db, 'cycles'), cycle);
  return cycleRef;
};

export const updateCycle = async (id: string, updates: Partial<Cycle>) => {
  await updateDoc(doc(db, 'cycles', id), updates);
};

export const getThrustAreas = async (): Promise<ThrustArea[]> => {
  const querySnapshot = await getDocs(collection(db, 'thrustAreas'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ThrustArea));
};

export const createCheckIn = async (checkIn: Omit<CheckIn, 'id' | 'employeeUpdatedAt'>) => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  
  const checkInRef = doc(collection(db, 'checkIns'));
  batch.set(checkInRef, {
    ...checkIn,
    employeeUpdatedAt: now
  });

  const goalDoc = await getDoc(doc(db, 'goals', checkIn.goalId));
  const goal = goalDoc.data() as Goal;

  if (goal.isShared) {
    const childrenQuery = query(collection(db, 'goals'), where('parentGoalId', '==', checkIn.goalId));
    const childrenSnapshot = await getDocs(childrenQuery);
    
    childrenSnapshot.docs.forEach(childDoc => {
      const childCheckInRef = doc(collection(db, 'checkIns'));
      batch.set(childCheckInRef, {
        ...checkIn,
        goalId: childDoc.id,
        employeeUpdatedAt: now,
        computedScore: checkIn.computedScore
      });
    });
  }

  return batch.commit();
};

export const updateCheckInManager = async (checkInId: string, comment: string | null, reviewedAt: string | null, actorId: string) => {
  const checkInRef = doc(db, 'checkIns', checkInId);
  const oldDoc = await getDoc(checkInRef);
  
  await updateDoc(checkInRef, {
    managerComment: comment,
    managerReviewedAt: reviewedAt
  });

  await logAudit({
    entity: 'CheckIn',
    entityId: checkInId,
    actorId: actorId,
    action: 'MANAGER_REVIEW',
    before: oldDoc.data(),
    after: { ...oldDoc.data(), managerComment: comment, managerReviewedAt: reviewedAt }
  });
};

export const getCheckInsByGoal = async (goalId: string): Promise<CheckIn[]> => {
  const q = query(collection(db, 'checkIns'), where('goalId', '==', goalId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CheckIn));
};

export const getSharedGoals = async (): Promise<Goal[]> => {
  const q = query(collection(db, 'goals'), where('isShared', '==', true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
};

export const getChildGoalsCount = async (parentId: string): Promise<number> => {
  const q = query(collection(db, 'goals'), where('parentGoalId', '==', parentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

export const logAudit = async (log: Omit<AuditLog, 'id' | 'createdAt'>) => {
  return addDoc(collection(db, 'auditLogs'), {
    ...log,
    createdAt: new Date().toISOString()
  });
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(100));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
};

export const unlockGoal = async (goalId: string, reason: string, actorId: string) => {
  const goalRef = doc(db, 'goals', goalId);
  const oldDoc = await getDoc(goalRef);
  const oldData = oldDoc.data() as Goal;

  await updateDoc(goalRef, {
    status: 'APPROVED',
    lockedAt: null,
    updatedAt: new Date().toISOString()
  });

  await logAudit({
    entity: 'Goal',
    entityId: goalId,
    actorId: actorId,
    action: 'UNLOCK',
    before: { ...oldData, unlockReason: null },
    after: { ...oldData, status: 'APPROVED', lockedAt: null, unlockReason: reason }
  });
};

export const getAllGoals = async (): Promise<Goal[]> => {
  const querySnapshot = await getDocs(collection(db, 'goals'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
};

export const getAllCheckIns = async (): Promise<CheckIn[]> => {
  const querySnapshot = await getDocs(collection(db, 'checkIns'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CheckIn));
};
