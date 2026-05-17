
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  managerId: string | null;
  department: string;
  photoUrl: string | null;
}

export interface ThrustArea {
  id: string;
  name: string;
}

export type Quarter = 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4_ANNUAL';

export interface CycleWindow {
  quarter: Quarter;
  opensAt: string;
  closesAt: string;
}

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  isActive: boolean;
  windows: CycleWindow[];
}

export type UOMType = 'NUMERIC_MIN' | 'NUMERIC_MAX' | 'PERCENT_MIN' | 'PERCENT_MAX' | 'TIMELINE' | 'ZERO';
export type GoalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED' | 'LOCKED';

export interface Goal {
  id: string;
  ownerId: string;
  cycleId: string;
  thrustAreaId: string;
  title: string;
  description: string;
  uomType: UOMType;
  target: string;
  weightage: number; // 10-100
  status: GoalStatus;
  isShared: boolean;
  parentGoalId: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  returnComment: string | null;
}

export type ProgressStatus = 'NOT_STARTED' | 'ON_TRACK' | 'COMPLETED';

export interface CheckIn {
  id: string;
  goalId: string;
  quarter: Quarter;
  actual: string;
  progressStatus: ProgressStatus;
  computedScore: number;
  managerComment: string | null;
  employeeUpdatedAt: string;
  managerReviewedAt: string | null;
}

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  actorId: string;
  action: string;
  before: any;
  after: any;
  createdAt: string;
}
