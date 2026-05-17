import { addDays, subDays } from "date-fns";
import type {
  AuditLog,
  CheckIn,
  DashboardSummary,
  Escalation,
  Goal,
  GoalCycle,
  GoalStatus,
  GoalWithOwner,
  LeaderboardEntry,
  Notification,
  Quarter,
  TeamAnalytics,
  User,
} from "@/types/domain";
import type {
  CheckInInput,
  GoalFormInput,
} from "@/lib/validations/goal.validation";
import {
  calculateProgress,
  deriveAchievementStatus,
} from "@/lib/utils/progress-calculator";

type DemoState = {
  users: User[];
  cycles: GoalCycle[];
  goals: Goal[];
  checkIns: CheckIn[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  escalations: Escalation[];
};

const now = new Date("2026-05-16T09:30:00.000Z");

const ids = {
  employee: "665500000000000000000001",
  manager: "665500000000000000000002",
  admin: "665500000000000000000003",
  analyst: "665500000000000000000004",
  engineer: "665500000000000000000005",
  cycle: "665500000000000000000101",
};

export const demoPassword = "demo123";

export const demoUserDirectory = {
  "employee@atomquest.com": ids.employee,
  "manager@atomquest.com": ids.manager,
  "admin@atomquest.com": ids.admin,
} as const;

const initialState: DemoState = {
  users: [
    {
      id: ids.employee,
      email: "employee@atomquest.com",
      name: "Arjun Sharma",
      role: "EMPLOYEE",
      managerId: ids.manager,
      department: "Product Engineering",
      designation: "Senior Software Engineer",
      employeeCode: "AQ-1024",
      azureAdId: "entra-arjun-sharma",
      streakCount: 8,
      lastLoginAt: subDays(now, 1).toISOString(),
      createdAt: subDays(now, 180).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: ids.manager,
      email: "manager@atomquest.com",
      name: "Priya Gupta",
      role: "MANAGER",
      managerId: null,
      department: "Product Engineering",
      designation: "Engineering Manager",
      employeeCode: "AQ-0442",
      azureAdId: "entra-priya-gupta",
      streakCount: 14,
      lastLoginAt: subDays(now, 1).toISOString(),
      createdAt: subDays(now, 260).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: ids.admin,
      email: "admin@atomquest.com",
      name: "Karan Verma",
      role: "ADMIN",
      managerId: null,
      department: "People Success",
      designation: "HR Operations Lead",
      employeeCode: "AQ-0001",
      azureAdId: "entra-karan-verma",
      streakCount: 22,
      lastLoginAt: subDays(now, 2).toISOString(),
      createdAt: subDays(now, 360).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: ids.analyst,
      email: "meera.analyst@atomquest.com",
      name: "Meera Analyst",
      role: "EMPLOYEE",
      managerId: ids.manager,
      department: "Product Engineering",
      designation: "Data Analyst",
      employeeCode: "AQ-1037",
      azureAdId: "entra-meera-analyst",
      streakCount: 5,
      lastLoginAt: subDays(now, 3).toISOString(),
      createdAt: subDays(now, 150).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: ids.engineer,
      email: "arjun.engineer@atomquest.com",
      name: "Arjun Engineer",
      role: "EMPLOYEE",
      managerId: ids.manager,
      department: "Platform",
      designation: "DevOps Engineer",
      employeeCode: "AQ-1041",
      azureAdId: "entra-arjun-engineer",
      streakCount: 11,
      lastLoginAt: subDays(now, 2).toISOString(),
      createdAt: subDays(now, 210).toISOString(),
      updatedAt: now.toISOString(),
    },
  ],
  cycles: [
    {
      id: ids.cycle,
      name: "FY 2026-27",
      startDate: "2026-04-01T00:00:00.000Z",
      endDate: "2027-03-31T23:59:59.000Z",
      q1Window: {
        start: "2026-04-01T00:00:00.000Z",
        end: "2026-06-30T23:59:59.000Z",
      },
      q2Window: {
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-09-30T23:59:59.000Z",
      },
      q3Window: {
        start: "2026-10-01T00:00:00.000Z",
        end: "2026-12-31T23:59:59.000Z",
      },
      q4Window: {
        start: "2027-01-01T00:00:00.000Z",
        end: "2027-03-31T23:59:59.000Z",
      },
      isActive: true,
    },
  ],
  goals: [
    createSeedGoal({
      id: "665500000000000000000201",
      employeeId: ids.employee,
      thrustArea: "Platform Reliability",
      title: "Reduce checkout API p95 latency",
      description:
        "Tune database access patterns, add query-level caching, and ship observability dashboards for the checkout API.",
      uomType: "MAX_NUMERIC",
      target: 220,
      weightage: 30,
      status: "APPROVED",
      progress: 78,
      actual: 282,
    }),
    createSeedGoal({
      id: "665500000000000000000202",
      employeeId: ids.employee,
      thrustArea: "Developer Experience",
      title: "Improve CI pass rate for critical repos",
      description:
        "Stabilize flaky suites, introduce quarantine workflows, and publish build-health scorecards.",
      uomType: "MIN_PERCENTAGE",
      target: 96,
      weightage: 25,
      status: "SUBMITTED",
      progress: 65,
      actual: 62,
      isShared: true,
      sharedWith: [ids.engineer],
    }),
    createSeedGoal({
      id: "665500000000000000000203",
      employeeId: ids.employee,
      thrustArea: "Security",
      title: "Zero critical vulnerabilities in release train",
      description:
        "Partner with security champions to eliminate critical dependency and container findings before release freeze.",
      uomType: "ZERO",
      target: 1,
      weightage: 20,
      status: "DRAFT",
      progress: 100,
      actual: 0,
    }),
    createSeedGoal({
      id: "665500000000000000000204",
      employeeId: ids.employee,
      thrustArea: "Product Delivery",
      title: "Ship goal analytics cockpit by Q2",
      description:
        "Deliver manager-ready analytics with adoption, risk, and progress trend views before the Q2 planning review.",
      uomType: "TIMELINE",
      target: 1,
      targetDate: "2026-08-31T00:00:00.000Z",
      weightage: 25,
      status: "APPROVED",
      progress: 48,
      actual: 0,
    }),
    createSeedGoal({
      id: "665500000000000000000205",
      employeeId: ids.analyst,
      thrustArea: "Data Quality",
      title: "Increase telemetry completeness",
      description:
        "Close instrumentation gaps and increase the completeness of event-level product analytics.",
      uomType: "MIN_PERCENTAGE",
      target: 95,
      weightage: 40,
      status: "SUBMITTED",
      progress: 72,
      actual: 68,
    }),
    createSeedGoal({
      id: "665500000000000000000206",
      employeeId: ids.analyst,
      thrustArea: "Insights",
      title: "Publish weekly executive scorecards",
      description:
        "Create a weekly business review pack with customer health and product adoption signals.",
      uomType: "MIN_NUMERIC",
      target: 40,
      weightage: 30,
      status: "APPROVED",
      progress: 55,
      actual: 22,
    }),
    createSeedGoal({
      id: "665500000000000000000207",
      employeeId: ids.engineer,
      thrustArea: "Infrastructure",
      title: "Cut deployment rollback rate",
      description:
        "Improve release automation and guardrails to reduce rollback incidents across tier-one services.",
      uomType: "MAX_PERCENTAGE",
      target: 2,
      weightage: 45,
      status: "APPROVED",
      progress: 82,
      actual: 2.4,
      isShared: true,
      sharedWith: [ids.employee],
    }),
    createSeedGoal({
      id: "665500000000000000000208",
      employeeId: ids.engineer,
      thrustArea: "Cost Efficiency",
      title: "Reduce non-production cloud waste",
      description:
        "Automate lifecycle policies and right-sizing recommendations for idle non-production workloads.",
      uomType: "MIN_PERCENTAGE",
      target: 18,
      weightage: 30,
      status: "REJECTED",
      progress: 20,
      actual: 3.6,
    }),
  ],
  checkIns: [
    {
      id: "665500000000000000000301",
      employeeId: ids.employee,
      managerId: ids.manager,
      goalId: "665500000000000000000201",
      quarter: "Q1",
      comments:
        "Query batching is live in staging. Cache hit rate is trending above 61%, with two slow endpoints left.",
      plannedValue: 320,
      actualValue: 282,
      progressScore: 78,
      checkInDate: subDays(now, 5).toISOString(),
      createdAt: subDays(now, 5).toISOString(),
      updatedAt: subDays(now, 5).toISOString(),
    },
    {
      id: "665500000000000000000302",
      employeeId: ids.employee,
      managerId: ids.manager,
      goalId: "665500000000000000000202",
      quarter: "Q1",
      comments:
        "Flaky test quarantine is active. The mobile pipeline still needs owner follow-through.",
      plannedValue: 55,
      actualValue: 62,
      progressScore: 65,
      checkInDate: subDays(now, 4).toISOString(),
      createdAt: subDays(now, 4).toISOString(),
      updatedAt: subDays(now, 4).toISOString(),
    },
  ],
  notifications: [
    {
      id: "665500000000000000000401",
      userId: ids.employee,
      type: "GOAL_APPROVED",
      title: "Goal approved",
      message: "Jane approved your latency reduction goal.",
      link: "/employee/goals",
      isRead: false,
      createdAt: subDays(now, 1).toISOString(),
    },
    {
      id: "665500000000000000000402",
      userId: ids.manager,
      type: "GOAL_SUBMITTED",
      title: "Goals pending review",
      message: "Three submitted goals need your approval before the Q1 window closes.",
      link: "/manager/approvals",
      isRead: false,
      createdAt: subDays(now, 1).toISOString(),
    },
    {
      id: "665500000000000000000403",
      userId: ids.admin,
      type: "CHECK_IN_DUE",
      title: "Cycle health alert",
      message: "Q1 check-ins are 82% complete across the demo organization.",
      link: "/admin/cycles",
      isRead: false,
      createdAt: subDays(now, 2).toISOString(),
    },
  ],
  auditLogs: [
    {
      id: "665500000000000000000501",
      goalId: "665500000000000000000201",
      userId: ids.manager,
      action: "APPROVED",
      field: "status",
      oldValue: "SUBMITTED",
      newValue: "APPROVED",
      timestamp: subDays(now, 9).toISOString(),
    },
    {
      id: "665500000000000000000502",
      goalId: "665500000000000000000202",
      userId: ids.employee,
      action: "SUBMITTED",
      field: "status",
      oldValue: "DRAFT",
      newValue: "SUBMITTED",
      timestamp: subDays(now, 2).toISOString(),
    },
  ],
  escalations: [
    {
      id: "665500000000000000000601",
      type: "GOAL_NOT_SUBMITTED",
      employeeId: ids.engineer,
      managerId: ids.manager,
      escalationLevel: 1,
      dueDate: addDays(now, 2).toISOString(),
      resolved: false,
      resolvedAt: null,
      createdAt: subDays(now, 1).toISOString(),
      updatedAt: subDays(now, 1).toISOString(),
    },
    {
      id: "665500000000000000000602",
      type: "CHECKIN_OVERDUE",
      employeeId: ids.analyst,
      managerId: ids.manager,
      escalationLevel: 1,
      dueDate: subDays(now, 1).toISOString(),
      resolved: true,
      resolvedAt: subDays(now, 1).toISOString(),
      createdAt: subDays(now, 5).toISOString(),
      updatedAt: subDays(now, 1).toISOString(),
    },
  ],
};

const state: DemoState = {
  users: [...initialState.users],
  cycles: [...initialState.cycles],
  goals: [...initialState.goals],
  checkIns: [...initialState.checkIns],
  notifications: [...initialState.notifications],
  auditLogs: [...initialState.auditLogs],
  escalations: [...initialState.escalations],
};

export function getDemoUserByEmail(email: string): User | undefined {
  return state.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function getDemoUserById(id: string): User | undefined {
  return state.users.find((user) => user.id === id);
}

export function listUsers(): User[] {
  return clone(state.users);
}

export function getSeedSnapshot(): DemoState {
  return clone(state);
}

export function listCycles(): GoalCycle[] {
  return clone(state.cycles);
}

export function getActiveCycle(): GoalCycle {
  return state.cycles.find((cycle) => cycle.isActive) ?? state.cycles[0];
}

export function listGoalsForUser(userId: string): GoalWithOwner[] {
  const user = requireUser(userId);
  const goals =
    user.role === "ADMIN"
      ? state.goals
      : state.goals.filter(
          (goal) =>
            goal.employeeId === user.id ||
            goal.sharedWith.includes(user.id) ||
            (user.role === "MANAGER" && isDirectReport(goal.employeeId, user.id)),
        );

  return goals.map(withOwner);
}

export function listEmployeeGoals(employeeId: string): GoalWithOwner[] {
  return state.goals
    .filter((goal) => goal.employeeId === employeeId || goal.sharedWith.includes(employeeId))
    .map(withOwner);
}

export function listTeamGoals(managerId: string): GoalWithOwner[] {
  return state.goals
    .filter((goal) => isDirectReport(goal.employeeId, managerId))
    .map(withOwner);
}

export function createGoal(employeeId: string, input: GoalFormInput): GoalWithOwner {
  const activeCycle = getActiveCycle();
  const createdAt = new Date().toISOString();
  const goal: Goal = {
    id: createObjectId(),
    employeeId,
    cycleId: activeCycle.id,
    thrustArea: sanitize(input.thrustArea),
    title: sanitize(input.title),
    description: input.description ? sanitize(input.description) : null,
    uomType: input.uomType,
    target: Number(input.target),
    targetDate: input.targetDate ? input.targetDate.toISOString() : null,
    weightage: Number(input.weightage),
    status: "DRAFT",
    isLocked: false,
    lockedAt: null,
    lockedBy: null,
    isShared: input.isShared,
    primaryOwnerId: input.isShared ? employeeId : null,
    sharedWith: input.sharedWith,
    currentProgress: 0,
    lastUpdatedAt: null,
    achievements: ["Q1", "Q2", "Q3", "Q4"].map((quarter) => ({
      quarter: quarter as Quarter,
      planned: 0,
      actual: 0,
      status: "NOT_STARTED",
      updatedAt: createdAt,
    })),
    createdAt,
    updatedAt: createdAt,
  };

  state.goals.unshift(goal);
  addAudit(goal.id, employeeId, "CREATED", null, null, null);
  notifyManagers(employeeId, "GOAL_DRAFTED", "New draft goal", `${withOwner(goal).employee.name} created a new draft goal.`, "/manager/team");
  return withOwner(goal);
}

export function updateGoal(employeeId: string, input: GoalFormInput & { id: string }): GoalWithOwner {
  const goal = requireGoal(input.id);
  assertGoalEditable(goal, employeeId);

  const before = JSON.stringify(goal);
  goal.thrustArea = sanitize(input.thrustArea);
  goal.title = sanitize(input.title);
  goal.description = input.description ? sanitize(input.description) : null;
  goal.uomType = input.uomType;
  goal.target = Number(input.target);
  goal.targetDate = input.targetDate ? input.targetDate.toISOString() : null;
  goal.weightage = Number(input.weightage);
  goal.isShared = input.isShared;
  goal.primaryOwnerId = input.isShared ? employeeId : null;
  goal.sharedWith = input.sharedWith;
  goal.updatedAt = new Date().toISOString();
  addAudit(goal.id, employeeId, "UPDATED", "goal", before, JSON.stringify(goal));

  return withOwner(goal);
}

export function submitGoals(employeeId: string): GoalWithOwner[] {
  const employeeGoals = state.goals.filter((goal) => goal.employeeId === employeeId);
  const totalWeightage = employeeGoals.reduce((sum, goal) => sum + goal.weightage, 0);

  if (employeeGoals.length === 0) {
    throw new Error("Create at least one goal before submission.");
  }

  if (employeeGoals.length > 8) {
    throw new Error("A goal sheet can contain a maximum of 8 goals.");
  }

  if (totalWeightage !== 100) {
    throw new Error("Total goal weightage must equal exactly 100% before submission.");
  }

  const submittedAt = new Date().toISOString();
  for (const goal of employeeGoals) {
    if (goal.status === "DRAFT" || goal.status === "REJECTED") {
      goal.status = "SUBMITTED";
      goal.updatedAt = submittedAt;
      addAudit(goal.id, employeeId, "SUBMITTED", "status", "DRAFT", "SUBMITTED");
    }
  }

  notifyManagers(
    employeeId,
    "GOAL_SUBMITTED",
    "Goal sheet submitted",
    `${requireUser(employeeId).name} submitted goals for approval.`,
    "/manager/approvals",
  );

  return listEmployeeGoals(employeeId);
}

export function decideGoal(managerId: string, goalId: string, status: Extract<GoalStatus, "APPROVED" | "REJECTED">, comment?: string): GoalWithOwner {
  const goal = requireGoal(goalId);
  const employee = requireUser(goal.employeeId);

  if (employee.managerId !== managerId) {
    throw new Error("Only the employee's manager can approve this goal.");
  }

  const oldStatus = goal.status;
  goal.status = status;
  goal.isLocked = status === "APPROVED";
  goal.lockedAt = status === "APPROVED" ? new Date().toISOString() : null;
  goal.lockedBy = status === "APPROVED" ? managerId : null;
  goal.updatedAt = new Date().toISOString();

  addAudit(goal.id, managerId, status, "status", oldStatus, status);

  state.notifications.unshift({
    id: createObjectId(),
    userId: employee.id,
    type: `GOAL_${status}`,
    title: status === "APPROVED" ? "Goal approved" : "Goal needs revision",
    message:
      status === "APPROVED"
        ? `${requireUser(managerId).name} approved "${goal.title}".`
        : `${requireUser(managerId).name} rejected "${goal.title}". ${comment ?? ""}`.trim(),
    link: "/employee/goals",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return withOwner(goal);
}

export function addCheckIn(actorId: string, input: CheckInInput): CheckIn {
  const goal = requireGoal(input.goalId);
  const employee = requireUser(goal.employeeId);
  const actor = requireUser(actorId);
  const managerId = actor.role === "MANAGER" ? actor.id : employee.managerId;

  if (!managerId) {
    throw new Error("A manager is required for check-ins.");
  }

  if (actor.role === "EMPLOYEE" && actor.id !== employee.id) {
    throw new Error("Employees can only update their own check-ins.");
  }

  if (actor.role === "MANAGER" && employee.managerId !== actor.id) {
    throw new Error("Managers can only check in direct reports.");
  }

  const progressScore = calculateProgress(goal.uomType, goal.target, input.actualValue, goal.targetDate ? new Date(goal.targetDate) : null, new Date());
  const createdAt = new Date().toISOString();
  const checkIn: CheckIn = {
    id: createObjectId(),
    employeeId: employee.id,
    managerId,
    goalId: goal.id,
    quarter: input.quarter,
    comments: sanitize(input.comments),
    plannedValue: input.plannedValue,
    actualValue: input.actualValue,
    progressScore,
    checkInDate: createdAt,
    createdAt,
    updatedAt: createdAt,
  };

  state.checkIns.unshift(checkIn);
  goal.currentProgress = progressScore;
  goal.lastUpdatedAt = createdAt;
  goal.updatedAt = createdAt;
  goal.achievements = goal.achievements.map((achievement) =>
    achievement.quarter === input.quarter
      ? {
          ...achievement,
          planned: input.plannedValue,
          actual: input.actualValue,
          status: deriveAchievementStatus(progressScore),
          updatedAt: createdAt,
        }
      : achievement,
  );
  addAudit(goal.id, actor.id, "CHECKED_IN", "currentProgress", null, String(progressScore));

  state.notifications.unshift({
    id: createObjectId(),
    userId: actor.role === "MANAGER" ? employee.id : managerId,
    type: "CHECK_IN_ADDED",
    title: "New check-in",
    message: `${actor.name} added a ${input.quarter} check-in for "${goal.title}".`,
    link: actor.role === "MANAGER" ? "/employee/check-ins" : "/manager/team",
    isRead: false,
    createdAt,
  });

  return clone(checkIn);
}

export function listCheckIns(userId: string): CheckIn[] {
  const user = requireUser(userId);

  if (user.role === "ADMIN") {
    return clone(state.checkIns);
  }

  return clone(
    state.checkIns.filter(
      (checkIn) =>
        checkIn.employeeId === user.id ||
        checkIn.managerId === user.id ||
        (user.role === "MANAGER" && isDirectReport(checkIn.employeeId, user.id)),
    ),
  );
}

export function listNotifications(userId: string): Notification[] {
  return clone(state.notifications.filter((notification) => notification.userId === userId));
}

export function markNotificationsRead(userId: string): Notification[] {
  const readAt = new Date().toISOString();
  for (const notification of state.notifications) {
    if (notification.userId === userId && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = readAt;
    }
  }

  return listNotifications(userId);
}

export function getDashboardSummary(userId: string): DashboardSummary {
  const goals = listGoalsForUser(userId);
  const unreadNotifications = state.notifications.filter((notification) => notification.userId === userId && !notification.isRead).length;

  return {
    totalGoals: goals.length,
    approvedGoals: goals.filter((goal) => goal.status === "APPROVED").length,
    submittedGoals: goals.filter((goal) => goal.status === "SUBMITTED").length,
    atRiskGoals: goals.filter((goal) => goal.achievements.some((achievement) => achievement.status === "AT_RISK")).length,
    averageProgress: average(goals.map((goal) => goal.currentProgress)),
    totalWeightage: goals
      .filter((goal) => goal.employeeId === userId)
      .reduce((sum, goal) => sum + goal.weightage, 0),
    unreadNotifications,
  };
}

export function getTeamAnalytics(userId: string): TeamAnalytics[] {
  const user = requireUser(userId);
  const goals = user.role === "EMPLOYEE" ? listGoalsForUser(userId) : user.role === "ADMIN" ? state.goals.map(withOwner) : listTeamGoals(userId);
  const departments = new Map<string, GoalWithOwner[]>();

  for (const goal of goals) {
    const department = goal.employee.department ?? "Unassigned";
    departments.set(department, [...(departments.get(department) ?? []), goal]);
  }

  return [...departments.entries()].map(([department, departmentGoals]) => {
    const employees = new Set(departmentGoals.map((goal) => goal.employeeId));
    return {
      department,
      averageProgress: average(departmentGoals.map((goal) => goal.currentProgress)),
      approvedRate: departmentGoals.length
        ? Math.round((departmentGoals.filter((goal) => goal.status === "APPROVED").length / departmentGoals.length) * 100)
        : 0,
      employeeCount: employees.size,
      atRiskCount: departmentGoals.filter((goal) => goal.achievements.some((achievement) => achievement.status === "AT_RISK")).length,
    };
  });
}

export function getLeaderboard(userId: string): LeaderboardEntry[] {
  const user = requireUser(userId);
  const visibleUsers =
    user.role === "ADMIN"
      ? state.users.filter((candidate) => candidate.role === "EMPLOYEE")
      : user.role === "MANAGER"
        ? state.users.filter((candidate) => candidate.managerId === user.id)
        : [user];

  return visibleUsers
    .map((employee) => {
      const goals = state.goals.filter((goal) => goal.employeeId === employee.id);
      const progress = average(goals.map((goal) => goal.currentProgress));
      return {
        employeeId: employee.id,
        name: employee.name,
        department: employee.department ?? "Unassigned",
        progress,
        badge: progress >= 95 ? "Platinum" : progress >= 80 ? "Gold" : progress >= 60 ? "Silver" : "Bronze",
        streakCount: employee.streakCount,
      } satisfies LeaderboardEntry;
    })
    .sort((a, b) => b.progress - a.progress);
}

export function getAuditLogs(userId: string): AuditLog[] {
  const visibleGoalIds = new Set(listGoalsForUser(userId).map((goal) => goal.id));
  return clone(state.auditLogs.filter((log) => visibleGoalIds.has(log.goalId)));
}

export function createCycle(input: { name: string; startDate: Date; endDate: Date; isActive: boolean }): GoalCycle {
  if (input.isActive) {
    state.cycles = state.cycles.map((cycle) => ({ ...cycle, isActive: false }));
  }

  const startDate = input.startDate;
  const cycle: GoalCycle = {
    id: createObjectId(),
    name: sanitize(input.name),
    startDate: startDate.toISOString(),
    endDate: input.endDate.toISOString(),
    q1Window: {
      start: startDate.toISOString(),
      end: addDays(startDate, 90).toISOString(),
    },
    q2Window: {
      start: addDays(startDate, 91).toISOString(),
      end: addDays(startDate, 181).toISOString(),
    },
    q3Window: {
      start: addDays(startDate, 182).toISOString(),
      end: addDays(startDate, 272).toISOString(),
    },
    q4Window: {
      start: addDays(startDate, 273).toISOString(),
      end: input.endDate.toISOString(),
    },
    isActive: input.isActive,
  };

  state.cycles.unshift(cycle);
  return clone(cycle);
}

export function getGoalExportRows(userId: string) {
  return listGoalsForUser(userId).map((goal) => ({
    employee: goal.employee.name,
    department: goal.employee.department ?? "",
    thrustArea: goal.thrustArea,
    title: goal.title,
    uomType: goal.uomType,
    target: goal.target,
    weightage: goal.weightage,
    status: goal.status,
    currentProgress: goal.currentProgress,
    shared: goal.isShared ? "Yes" : "No",
  }));
}

function createSeedGoal(input: {
  id: string;
  employeeId: string;
  thrustArea: string;
  title: string;
  description: string;
  uomType: Goal["uomType"];
  target: number;
  weightage: number;
  status: GoalStatus;
  progress: number;
  actual: number;
  targetDate?: string;
  isShared?: boolean;
  sharedWith?: string[];
}): Goal {
  const updatedAt = subDays(now, 7).toISOString();
  return {
    id: input.id,
    employeeId: input.employeeId,
    cycleId: ids.cycle,
    thrustArea: input.thrustArea,
    title: input.title,
    description: input.description,
    uomType: input.uomType,
    target: input.target,
    targetDate: input.targetDate ?? null,
    weightage: input.weightage,
    status: input.status,
    isLocked: input.status === "APPROVED",
    lockedAt: input.status === "APPROVED" ? subDays(now, 9).toISOString() : null,
    lockedBy: input.status === "APPROVED" ? ids.manager : null,
    isShared: input.isShared ?? false,
    primaryOwnerId: input.isShared ? input.employeeId : null,
    sharedWith: input.sharedWith ?? [],
    currentProgress: input.progress,
    lastUpdatedAt: updatedAt,
    achievements: [
      {
        quarter: "Q1",
        planned: Math.round(input.target * 0.25 * 10) / 10,
        actual: input.actual,
        status: deriveAchievementStatus(input.progress),
        updatedAt,
      },
      {
        quarter: "Q2",
        planned: Math.round(input.target * 0.5 * 10) / 10,
        actual: 0,
        status: "NOT_STARTED",
        updatedAt,
      },
      {
        quarter: "Q3",
        planned: Math.round(input.target * 0.75 * 10) / 10,
        actual: 0,
        status: "NOT_STARTED",
        updatedAt,
      },
      {
        quarter: "Q4",
        planned: input.target,
        actual: 0,
        status: "NOT_STARTED",
        updatedAt,
      },
    ],
    createdAt: subDays(now, 35).toISOString(),
    updatedAt,
  };
}

function withOwner(goal: Goal): GoalWithOwner {
  const employee = requireUser(goal.employeeId);
  return {
    ...clone(goal),
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      managerId: employee.managerId,
    },
  };
}

function requireUser(userId: string): User {
  const user = state.users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }

  return user;
}

function requireGoal(goalId: string): Goal {
  const goal = state.goals.find((candidate) => candidate.id === goalId);
  if (!goal) {
    throw new Error("Goal not found.");
  }

  return goal;
}

function assertGoalEditable(goal: Goal, employeeId: string) {
  if (goal.employeeId !== employeeId) {
    throw new Error("You can only edit your own goals.");
  }

  if (goal.isLocked || goal.status === "APPROVED" || goal.status === "LOCKED") {
    throw new Error("Approved or locked goals cannot be edited.");
  }
}

function isDirectReport(employeeId: string, managerId: string): boolean {
  return state.users.some((user) => user.id === employeeId && user.managerId === managerId);
}

function notifyManagers(employeeId: string, type: string, title: string, message: string, link: string) {
  const employee = requireUser(employeeId);
  if (!employee.managerId) {
    return;
  }

  state.notifications.unshift({
    id: createObjectId(),
    userId: employee.managerId,
    type,
    title,
    message,
    link,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

function addAudit(goalId: string, userId: string, action: string, field: string | null, oldValue: string | null, newValue: string | null) {
  state.auditLogs.unshift({
    id: createObjectId(),
    goalId,
    userId,
    action,
    field,
    oldValue,
    newValue,
    timestamp: new Date().toISOString(),
  });
}

function average(values: number[]): number {
  const numericValues = values.filter(Number.isFinite);
  if (!numericValues.length) {
    return 0;
  }

  return Number((numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length).toFixed(1));
}

function sanitize(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createObjectId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 24);
}
