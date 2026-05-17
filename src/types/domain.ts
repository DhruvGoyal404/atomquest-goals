export type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type UoMType =
  | "MIN_NUMERIC"
  | "MAX_NUMERIC"
  | "MIN_PERCENTAGE"
  | "MAX_PERCENTAGE"
  | "TIMELINE"
  | "ZERO";

export type GoalStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LOCKED";

export type AchievementStatus = "NOT_STARTED" | "ON_TRACK" | "COMPLETED" | "AT_RISK";

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
  managerId?: string | null;
  department?: string | null;
  designation?: string | null;
  employeeCode?: string | null;
  azureAdId?: string | null;
  streakCount: number;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GoalCycle = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  q1Window: QuarterWindow;
  q2Window: QuarterWindow;
  q3Window: QuarterWindow;
  q4Window: QuarterWindow;
  isActive: boolean;
};

export type QuarterWindow = {
  start: string;
  end: string;
};

export type Achievement = {
  quarter: Quarter;
  planned: number;
  actual: number;
  status: AchievementStatus;
  updatedAt: string;
};

export type Goal = {
  id: string;
  employeeId: string;
  cycleId: string;
  thrustArea: string;
  title: string;
  description?: string | null;
  uomType: UoMType;
  target: number;
  targetDate?: string | null;
  weightage: number;
  status: GoalStatus;
  isLocked: boolean;
  lockedAt?: string | null;
  lockedBy?: string | null;
  isShared: boolean;
  primaryOwnerId?: string | null;
  sharedWith: string[];
  currentProgress: number;
  lastUpdatedAt?: string | null;
  achievements: Achievement[];
  createdAt: string;
  updatedAt: string;
};

export type GoalWithOwner = Goal & {
  employee: Pick<User, "id" | "name" | "email" | "department" | "designation" | "managerId">;
};

export type CheckIn = {
  id: string;
  employeeId: string;
  managerId: string;
  goalId: string;
  quarter: Quarter;
  comments: string;
  plannedValue: number;
  actualValue: number;
  progressScore: number;
  checkInDate: string;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  goalId: string;
  userId: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  timestamp: string;
};

export type DashboardSummary = {
  totalGoals: number;
  approvedGoals: number;
  submittedGoals: number;
  atRiskGoals: number;
  averageProgress: number;
  totalWeightage: number;
  unreadNotifications: number;
};

export type TeamAnalytics = {
  department: string;
  averageProgress: number;
  approvedRate: number;
  employeeCount: number;
  atRiskCount: number;
};

export type LeaderboardEntry = {
  employeeId: string;
  name: string;
  department: string;
  progress: number;
  badge: "Bronze" | "Silver" | "Gold" | "Platinum";
  streakCount: number;
};

export type GoalPrediction = {
  goalId: string;
  title: string;
  currentProgress: number;
  predictedProgress: number;
  onTrackToComplete: boolean;
  monthlyData: Array<{ month: string; actual: number | null; projected: number }>;
};

export type Escalation = {
  id: string;
  type: "GOAL_NOT_SUBMITTED" | "GOAL_NOT_APPROVED" | "CHECKIN_OVERDUE";
  employeeId: string;
  employeeName?: string;
  managerId?: string | null;
  escalationLevel: number;
  dueDate: string;
  resolved: boolean;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
