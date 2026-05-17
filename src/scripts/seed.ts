
'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { UserRole } from '@/lib/types';

const PASSWORD = "Demo@123";

const demoUsers = [
  { email: 'admin@demo.com', name: 'System Admin', role: 'ADMIN' as UserRole, dept: 'Operations' },
  { email: 'manager1@demo.com', name: 'Project Lead A', role: 'MANAGER' as UserRole, dept: 'Engineering' },
  { email: 'manager2@demo.com', name: 'Department Head B', role: 'MANAGER' as UserRole, dept: 'Product' },
  { email: 'emp1@demo.com', name: 'Alice Engineer', role: 'EMPLOYEE' as UserRole, dept: 'Engineering', reportsTo: 'manager1@demo.com' },
  { email: 'emp2@demo.com', name: 'Bob Developer', role: 'EMPLOYEE' as UserRole, dept: 'Engineering', reportsTo: 'manager1@demo.com' },
  { email: 'emp3@demo.com', name: 'Charlie Dev', role: 'EMPLOYEE' as UserRole, dept: 'Engineering', reportsTo: 'manager1@demo.com' },
];

const thrustAreas = [
  "Revenue Growth",
  "Customer Success",
  "Operational Excellence",
  "Innovation",
  "People Development"
];

export async function seedDatabase() {
  console.log("Starting high-fidelity demo seed aligned with Hackathon PS...");

  try {
    // 1. Seed Thrust Areas
    const thrustBatch = writeBatch(db);
    const areaIds: string[] = [];
    for (const name of thrustAreas) {
      const areaRef = doc(collection(db, 'thrustAreas'));
      thrustBatch.set(areaRef, { name });
      areaIds.push(areaRef.id);
    }
    await thrustBatch.commit();

    // 2. Seed Active Cycle (Aligned with PS Section 2.3)
    const cycleId = "FY-2025-26";
    const now = new Date();
    
    await setDoc(doc(db, 'cycles', cycleId), {
      name: "FY 2025-26",
      startDate: "2025-05-01T00:00:00Z",
      isActive: true,
      windows: [
        { quarter: "GOAL_SETTING", opensAt: "2025-05-01T00:00:00Z", closesAt: "2025-06-30T23:59:59Z" },
        { quarter: "Q1", opensAt: "2025-07-01T00:00:00Z", closesAt: "2025-07-31T23:59:59Z" },
        { quarter: "Q2", opensAt: "2025-10-01T00:00:00Z", closesAt: "2025-10-31T23:59:59Z" },
        { quarter: "Q3", opensAt: "2026-01-01T00:00:00Z", closesAt: "2026-01-31T23:59:59Z" },
        { quarter: "Q4_ANNUAL", opensAt: "2026-03-01T00:00:00Z", closesAt: "2026-04-30T23:59:59Z" },
      ]
    });

    // To ensure Q1 is currently OPEN for the demo today, we adjust its window to include TODAY
    const opens = new Date(now);
    opens.setDate(opens.getDate() - 5);
    const closes = new Date(now);
    closes.setDate(closes.getDate() + 25);

    await setDoc(doc(db, 'cycles', cycleId), {
      windows: [
        { quarter: "GOAL_SETTING", opensAt: "2025-05-01T00:00:00Z", closesAt: "2025-06-30T23:59:59Z" },
        { quarter: "Q1", opensAt: opens.toISOString(), closesAt: closes.toISOString() }, // ACTIVE FOR DEMO
        { quarter: "Q2", opensAt: "2025-10-01T00:00:00Z", closesAt: "2025-10-31T23:59:59Z" },
        { quarter: "Q3", opensAt: "2026-01-01T00:00:00Z", closesAt: "2026-01-31T23:59:59Z" },
        { quarter: "Q4_ANNUAL", opensAt: "2026-03-01T00:00:00Z", closesAt: "2026-04-30T23:59:59Z" },
      ]
    }, { merge: true });

    // 3. Seed Users
    const userMap: Record<string, string> = {};
    for (const u of demoUsers) {
      let uid = "";
      try {
        const res = await createUserWithEmailAndPassword(auth, u.email, PASSWORD);
        uid = res.user.uid;
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          const res = await signInWithEmailAndPassword(auth, u.email, PASSWORD);
          uid = res.user.uid;
        } else { continue; }
      }
      userMap[u.email] = uid;
      
      await setDoc(doc(db, 'users', uid), {
        email: u.email,
        name: u.name,
        role: u.role,
        department: u.dept,
        managerId: null,
        photoUrl: `https://picsum.photos/seed/${uid}/200/200`
      });
    }

    // Update Reporting Structure
    for (const u of demoUsers) {
      if (u.reportsTo && userMap[u.reportsTo]) {
        await setDoc(doc(db, 'users', userMap[u.email]), { managerId: userMap[u.reportsTo] }, { merge: true });
      }
    }

    // 4. Seed Demo Goals & Check-ins for Analytics
    const aliceUid = userMap['emp1@demo.com'];
    const goalRef = doc(collection(db, 'goals'));
    await setDoc(goalRef, {
      ownerId: aliceUid,
      cycleId,
      thrustAreaId: areaIds[0],
      title: "Scale Infrastructure by 40%",
      description: "Increase server capacity to handle project X",
      uomType: "PERCENT_MIN",
      target: "40",
      weightage: 30,
      status: "APPROVED",
      isShared: false,
      parentGoalId: null,
      lockedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Seed a Q1 Check-in
    await setDoc(doc(collection(db, 'checkIns')), {
      goalId: goalRef.id,
      quarter: "Q1",
      actual: "35",
      progressStatus: "ON_TRACK",
      computedScore: 0.875,
      managerComment: "Great progress on the cluster scaling.",
      employeeUpdatedAt: new Date().toISOString(),
      managerReviewedAt: new Date().toISOString()
    });

    // Seed an Escalation Log for Bonus Points
    await setDoc(doc(collection(db, 'auditLogs')), {
      entity: 'System',
      entityId: 'ESCALATION_ENGINE',
      actorId: 'system',
      action: 'ESCALATE',
      before: { status: 'PENDING' },
      after: { 
        type: 'GOAL_SUBMISSION_DELAY',
        employee: 'Charlie Dev',
        message: 'Goal sheet not submitted within 15 days of window opening. Escalated to Project Lead A.'
      },
      createdAt: new Date().toISOString()
    });

    await signOut(auth);
    console.log("PS-Aligned seed complete!");
  } catch (error) {
    console.error("Seed failed:", error);
  }
}
