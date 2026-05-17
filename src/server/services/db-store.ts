import { prisma } from "@/lib/db/prisma";
import { getCachedJson, setCachedJson, publish } from "@/lib/cache/redis";
import {
  calculateProgress,
  deriveAchievementStatus,
} from "@/lib/utils/progress-calculator";
import { addDays, format } from "date-fns";
import type {
  AuditLog,
  CheckIn,
  DashboardSummary,
  Escalation,
  Goal,
  GoalCycle,
  GoalPrediction,
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
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Helpers: Convert Prisma models → domain types (Date → string)
// ---------------------------------------------------------------------------

type PrismaUser = Awaited<ReturnType<typeof prisma.user.findFirst>>;
type PrismaGoal = Awaited<ReturnType<typeof prisma.goal.findFirst>>;

function toUser(u: NonNullable<PrismaUser>): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    image: u.image ?? null,
    managerId: u.managerId ?? null,
    department: u.department ?? null,
    designation: u.designation ?? null,
    employeeCode: u.employeeCode ?? null,
    azureAdId: u.azureAdId ?? null,
    streakCount: u.streakCount,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export async function updateUserProfile(
  userId: string,
  input: { name?: string; designation?: string | null; image?: string | null },
): Promise<User> {
  const data: { name?: string; designation?: string | null; image?: string | null } = {};
  if (input.name !== undefined) data.name = sanitize(input.name);
  if (input.designation !== undefined) data.designation = input.designation ? sanitize(input.designation) : null;
  if (input.image !== undefined) data.image = input.image;
  const updated = await prisma.user.update({ where: { id: userId }, data });
  await invalidateUserCaches(userId);
  return toUser(updated);
}

function toGoal(g: NonNullable<PrismaGoal>): Goal {
  return {
    id: g.id,
    employeeId: g.employeeId,
    cycleId: g.cycleId,
    thrustArea: g.thrustArea,
    title: g.title,
    description: g.description ?? null,
    uomType: g.uomType,
    target: g.target,
    targetDate: g.targetDate?.toISOString() ?? null,
    weightage: g.weightage,
    status: g.status,
    isLocked: g.isLocked,
    lockedAt: g.lockedAt?.toISOString() ?? null,
    lockedBy: g.lockedBy ?? null,
    isShared: g.isShared,
    primaryOwnerId: g.primaryOwnerId ?? null,
    sharedWith: g.sharedWith,
    currentProgress: g.currentProgress,
    lastUpdatedAt: g.lastUpdatedAt?.toISOString() ?? null,
    achievements: g.achievements as Goal["achievements"],
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

type PrismaGoalWithEmployee = NonNullable<PrismaGoal> & {
  employee: NonNullable<PrismaUser>;
};

function toGoalWithOwner(g: PrismaGoalWithEmployee): GoalWithOwner {
  return {
    ...toGoal(g),
    employee: {
      id: g.employee.id,
      name: g.employee.name,
      email: g.employee.email,
      department: g.employee.department ?? null,
      designation: g.employee.designation ?? null,
      managerId: g.employee.managerId ?? null,
    },
  };
}

function toCheckIn(c: Awaited<ReturnType<typeof prisma.checkIn.findFirst>> & object): CheckIn {
  return {
    id: c.id,
    employeeId: c.employeeId,
    managerId: c.managerId,
    goalId: c.goalId,
    quarter: c.quarter as Quarter,
    comments: c.comments,
    plannedValue: c.plannedValue,
    actualValue: c.actualValue,
    progressScore: c.progressScore,
    checkInDate: c.checkInDate.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function toNotification(n: Awaited<ReturnType<typeof prisma.notification.findFirst>> & object): Notification {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link ?? null,
    isRead: n.isRead,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  };
}

function toAuditLog(a: Awaited<ReturnType<typeof prisma.auditLog.findFirst>> & object): AuditLog {
  return {
    id: a.id,
    goalId: a.goalId,
    userId: a.userId,
    action: a.action,
    field: a.field ?? null,
    oldValue: a.oldValue ?? null,
    newValue: a.newValue ?? null,
    timestamp: a.timestamp.toISOString(),
  };
}

function toCycle(c: Awaited<ReturnType<typeof prisma.goalCycle.findFirst>> & object): GoalCycle {
  return {
    id: c.id,
    name: c.name,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    q1Window: c.q1Window as GoalCycle["q1Window"],
    q2Window: c.q2Window as GoalCycle["q2Window"],
    q3Window: c.q3Window as GoalCycle["q3Window"],
    q4Window: c.q4Window as GoalCycle["q4Window"],
    isActive: c.isActive,
  };
}

const employeeSelect = {
  id: true, name: true, email: true, department: true, designation: true, managerId: true,
} as const;

function sanitize(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

async function invalidateUserCaches(userId: string) {
  // Best-effort cache invalidation; if Redis is down, it's fine.
  const { redis } = await import("@/lib/cache/redis");
  if (!redis) return;
  const keys = [
    `dashboard:${userId}`,
    `goals:${userId}`,
    `leaderboard:${userId}`,
    `team-analytics:${userId}`,
  ];
  await Promise.allSettled(keys.map((k) => redis.del(k)));
}

// ---------------------------------------------------------------------------
// User lookups
// ---------------------------------------------------------------------------

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  return u ? toUser(u) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const u = await prisma.user.findUnique({ where: { id } });
  return u ? toUser(u) : undefined;
}

export async function getUserPasswordHash(email: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { passwordHash: true } });
  return u?.passwordHash ?? null;
}

export async function listUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return users.map(toUser);
}

// ---------------------------------------------------------------------------
// Cycles
// ---------------------------------------------------------------------------

export async function listCycles(): Promise<GoalCycle[]> {
  const cycles = await prisma.goalCycle.findMany({ orderBy: { startDate: "desc" } });
  return cycles.map(toCycle);
}

export async function getActiveCycle(): Promise<GoalCycle> {
  const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    const fallback = await prisma.goalCycle.findFirst({ orderBy: { startDate: "desc" } });
    if (!fallback) throw new Error("No goal cycles exist. Seed the database first.");
    return toCycle(fallback);
  }
  return toCycle(cycle);
}

export async function createCycle(input: { name: string; startDate: Date; endDate: Date; isActive: boolean }): Promise<GoalCycle> {
  if (input.isActive) {
    await prisma.goalCycle.updateMany({ data: { isActive: false } });
  }
  const startDate = input.startDate;
  const cycle = await prisma.goalCycle.create({
    data: {
      name: sanitize(input.name),
      startDate,
      endDate: input.endDate,
      q1Window: { start: startDate.toISOString(), end: addDays(startDate, 90).toISOString() },
      q2Window: { start: addDays(startDate, 91).toISOString(), end: addDays(startDate, 181).toISOString() },
      q3Window: { start: addDays(startDate, 182).toISOString(), end: addDays(startDate, 272).toISOString() },
      q4Window: { start: addDays(startDate, 273).toISOString(), end: input.endDate.toISOString() },
      isActive: input.isActive,
    },
  });
  return toCycle(cycle);
}

export async function listLockedGoals(): Promise<GoalWithOwner[]> {
  const goals = await prisma.goal.findMany({
    where: { isLocked: true, status: "APPROVED" },
    include: { employee: { select: employeeSelect } },
    orderBy: { lockedAt: "desc" },
  });
  return goals.map((g) => toGoalWithOwner(g as PrismaGoalWithEmployee));
}

// ---------------------------------------------------------------------------
// Goals — Queries
// ---------------------------------------------------------------------------

async function goalWhereForUser(userId: string): Promise<Prisma.GoalWhereInput> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, id: true } });
  if (!user) throw new Error("User not found.");
  if (user.role === "ADMIN") return {};
  if (user.role === "MANAGER") {
    const directReportIds = (await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })).map((u) => u.id);
    return {
      OR: [
        { employeeId: userId },
        { sharedWith: { has: userId } },
        { employeeId: { in: directReportIds } },
      ],
    };
  }
  return {
    OR: [{ employeeId: userId }, { sharedWith: { has: userId } }],
  };
}

export async function listGoalsForUser(userId: string): Promise<GoalWithOwner[]> {
  const cached = await getCachedJson<GoalWithOwner[]>(`goals:${userId}`);
  if (cached) return cached;

  const where = await goalWhereForUser(userId);
  const goals = await prisma.goal.findMany({ where, include: { employee: { select: employeeSelect } }, orderBy: { createdAt: "desc" } });
  const result = goals.map((g) => toGoalWithOwner(g as PrismaGoalWithEmployee));

  await setCachedJson(`goals:${userId}`, result, 30);
  return result;
}

export async function listEmployeeGoals(employeeId: string): Promise<GoalWithOwner[]> {
  const goals = await prisma.goal.findMany({
    where: { OR: [{ employeeId }, { sharedWith: { has: employeeId } }] },
    include: { employee: { select: employeeSelect } },
    orderBy: { createdAt: "desc" },
  });
  return goals.map((g) => toGoalWithOwner(g as PrismaGoalWithEmployee));
}

export async function listTeamGoals(managerId: string): Promise<GoalWithOwner[]> {
  const directReportIds = (await prisma.user.findMany({ where: { managerId }, select: { id: true } })).map((u) => u.id);
  const goals = await prisma.goal.findMany({
    where: { employeeId: { in: directReportIds } },
    include: { employee: { select: employeeSelect } },
    orderBy: { createdAt: "desc" },
  });
  return goals.map((g) => toGoalWithOwner(g as PrismaGoalWithEmployee));
}

// ---------------------------------------------------------------------------
// Goals — Mutations
// ---------------------------------------------------------------------------

export async function createGoal(employeeId: string, input: GoalFormInput): Promise<GoalWithOwner> {
  const activeCycle = await getActiveCycle();
  const now = new Date();
  const achievements = (["Q1", "Q2", "Q3", "Q4"] as Quarter[]).map((quarter) => ({
    quarter,
    planned: 0,
    actual: 0,
    status: "NOT_STARTED",
    updatedAt: now.toISOString(),
  }));

  const goal = await prisma.goal.create({
    data: {
      employeeId,
      cycleId: activeCycle.id,
      thrustArea: sanitize(input.thrustArea),
      title: sanitize(input.title),
      description: input.description ? sanitize(input.description) : null,
      uomType: input.uomType,
      target: Number(input.target),
      targetDate: input.targetDate ?? null,
      weightage: Number(input.weightage),
      status: "DRAFT",
      isShared: input.isShared,
      primaryOwnerId: input.isShared ? employeeId : null,
      sharedWith: input.sharedWith,
      currentProgress: 0,
      achievements: achievements as unknown as Prisma.InputJsonValue[],
    },
    include: { employee: { select: employeeSelect } },
  });

  await prisma.auditLog.create({ data: { goalId: goal.id, userId: employeeId, action: "CREATED" } });
  await notifyManagers(employeeId, "GOAL_DRAFTED", "New draft goal", `${goal.employee.name} created a new draft goal.`, "/manager/team");
  await invalidateUserCaches(employeeId);

  return toGoalWithOwner(goal as PrismaGoalWithEmployee);
}

export async function updateGoal(employeeId: string, input: GoalFormInput & { id: string }): Promise<GoalWithOwner> {
  const existing = await prisma.goal.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("Goal not found.");
  if (existing.isLocked || existing.status === "APPROVED" || existing.status === "LOCKED") {
    throw new Error("Approved or locked goals cannot be edited.");
  }

  // GAP 2 FIX: Shared goal recipients can only change weightage
  const isSharedRecipient = existing.isShared && existing.sharedWith.includes(employeeId) && existing.primaryOwnerId !== employeeId;
  if (isSharedRecipient) {
    // Recipients may only adjust weightage; title, target, uomType are read-only
    const before = JSON.stringify(existing);
    const goal = await prisma.goal.update({
      where: { id: input.id },
      data: { weightage: Number(input.weightage) },
      include: { employee: { select: employeeSelect } },
    });
    await prisma.auditLog.create({ data: { goalId: goal.id, userId: employeeId, action: "UPDATED", field: "weightage", oldValue: String(existing.weightage), newValue: String(input.weightage) } });
    await invalidateUserCaches(employeeId);
    return toGoalWithOwner(goal as PrismaGoalWithEmployee);
  }

  // Owner or self-owned goal: full edit
  if (existing.employeeId !== employeeId) throw new Error("You can only edit your own goals.");

  const before = JSON.stringify(existing);
  const goal = await prisma.goal.update({
    where: { id: input.id },
    data: {
      thrustArea: sanitize(input.thrustArea),
      title: sanitize(input.title),
      description: input.description ? sanitize(input.description) : null,
      uomType: input.uomType,
      target: Number(input.target),
      targetDate: input.targetDate ?? null,
      weightage: Number(input.weightage),
      isShared: input.isShared,
      primaryOwnerId: input.isShared ? employeeId : null,
      sharedWith: input.sharedWith,
    },
    include: { employee: { select: employeeSelect } },
  });

  await prisma.auditLog.create({ data: { goalId: goal.id, userId: employeeId, action: "UPDATED", field: "goal", oldValue: before, newValue: JSON.stringify(goal) } });
  await invalidateUserCaches(employeeId);

  return toGoalWithOwner(goal as PrismaGoalWithEmployee);
}

// GAP 1 FIX: Manager can inline-edit target/weightage on submitted goals before approving
export async function managerEditGoal(managerId: string, goalId: string, edits: { target?: number; weightage?: number; comment?: string }): Promise<GoalWithOwner> {
  const existing = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!existing) throw new Error("Goal not found.");
  if (existing.status !== "SUBMITTED") throw new Error("Only submitted goals can be edited by the manager.");
  const employee = await prisma.user.findUnique({ where: { id: existing.employeeId } });
  if (!employee || employee.managerId !== managerId) throw new Error("This employee is not in your team.");

  const data: Record<string, unknown> = {};
  const changes: string[] = [];
  if (edits.target !== undefined && edits.target !== existing.target) {
    data.target = edits.target;
    changes.push(`target: ${existing.target} → ${edits.target}`);
  }
  if (edits.weightage !== undefined && edits.weightage !== existing.weightage) {
    data.weightage = edits.weightage;
    changes.push(`weightage: ${existing.weightage} → ${edits.weightage}`);
  }
  if (Object.keys(data).length === 0) throw new Error("No changes provided.");

  const goal = await prisma.goal.update({ where: { id: goalId }, data, include: { employee: { select: employeeSelect } } });
  const manager = await prisma.user.findUnique({ where: { id: managerId }, select: { name: true } });

  await prisma.auditLog.create({ data: { goalId, userId: managerId, action: "MANAGER_EDITED", field: "target/weightage", oldValue: `target:${existing.target},weightage:${existing.weightage}`, newValue: changes.join("; ") } });
  await prisma.notification.create({
    data: {
      userId: employee.id,
      type: "GOAL_EDITED_BY_MANAGER",
      title: "Manager edited your goal",
      message: `${manager?.name ?? "Manager"} adjusted "${goal.title}": ${changes.join(", ")}.${edits.comment ? " Comment: " + edits.comment : ""}`,
      link: "/employee/goals",
    },
  });

  await invalidateUserCaches(employee.id);
  await invalidateUserCaches(managerId);
  await publish(`events:${employee.id}`, { type: "GOAL_EDITED_BY_MANAGER", goalId });

  return toGoalWithOwner(goal as PrismaGoalWithEmployee);
}

// GAP 5 FIX: Admin can unlock a locked/approved goal for re-editing
export async function adminUnlockGoal(adminId: string, goalId: string): Promise<GoalWithOwner> {
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true, name: true } });
  if (!admin || admin.role !== "ADMIN") throw new Error("Admin access required.");

  const existing = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!existing) throw new Error("Goal not found.");
  if (!existing.isLocked && existing.status !== "APPROVED") throw new Error("Goal is not locked.");

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { isLocked: false, lockedAt: null, lockedBy: null, status: "DRAFT" },
    include: { employee: { select: employeeSelect } },
  });

  await prisma.auditLog.create({ data: { goalId, userId: adminId, action: "UNLOCKED", field: "status", oldValue: existing.status, newValue: "DRAFT" } });
  await prisma.notification.create({
    data: {
      userId: existing.employeeId,
      type: "GOAL_UNLOCKED",
      title: "Goal unlocked",
      message: `${admin.name} unlocked "${goal.title}" for re-editing.`,
      link: "/employee/goals",
    },
  });

  await invalidateUserCaches(existing.employeeId);
  await publish(`events:${existing.employeeId}`, { type: "GOAL_UNLOCKED", goalId });

  return toGoalWithOwner(goal as PrismaGoalWithEmployee);
}

export async function submitGoals(employeeId: string): Promise<GoalWithOwner[]> {
  const employeeGoals = await prisma.goal.findMany({ where: { employeeId } });
  if (employeeGoals.length === 0) throw new Error("Create at least one goal before submission.");
  if (employeeGoals.length > 8) throw new Error("A goal sheet can contain a maximum of 8 goals.");

  const totalWeightage = employeeGoals.reduce((sum, g) => sum + g.weightage, 0);
  if (totalWeightage !== 100) throw new Error("Total goal weightage must equal exactly 100% before submission.");

  const submittableIds = employeeGoals.filter((g) => g.status === "DRAFT" || g.status === "REJECTED").map((g) => g.id);
  if (submittableIds.length > 0) {
    await prisma.goal.updateMany({ where: { id: { in: submittableIds } }, data: { status: "SUBMITTED" } });
    for (const id of submittableIds) {
      await prisma.auditLog.create({ data: { goalId: id, userId: employeeId, action: "SUBMITTED", field: "status", oldValue: "DRAFT", newValue: "SUBMITTED" } });
    }
  }

  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  await notifyManagers(employeeId, "GOAL_SUBMITTED", "Goal sheet submitted", `${employee?.name ?? "Employee"} submitted goals for approval.`, "/manager/approvals");
  await invalidateUserCaches(employeeId);

  return listEmployeeGoals(employeeId);
}

export async function decideGoal(managerId: string, goalId: string, status: Extract<GoalStatus, "APPROVED" | "REJECTED">, comment?: string): Promise<GoalWithOwner> {
  const existing = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!existing) throw new Error("Goal not found.");
  const employee = await prisma.user.findUnique({ where: { id: existing.employeeId } });
  if (!employee) throw new Error("Employee not found.");
  if (employee.managerId !== managerId) throw new Error("Only the employee's manager can approve this goal.");

  const manager = await prisma.user.findUnique({ where: { id: managerId } });
  const now = new Date();

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      status,
      isLocked: status === "APPROVED",
      lockedAt: status === "APPROVED" ? now : null,
      lockedBy: status === "APPROVED" ? managerId : null,
    },
    include: { employee: { select: employeeSelect } },
  });

  await prisma.auditLog.create({ data: { goalId, userId: managerId, action: status, field: "status", oldValue: existing.status, newValue: status } });
  await prisma.notification.create({
    data: {
      userId: employee.id,
      type: `GOAL_${status}`,
      title: status === "APPROVED" ? "Goal approved" : "Goal needs revision",
      message: status === "APPROVED"
        ? `${manager?.name ?? "Manager"} approved "${goal.title}".`
        : `${manager?.name ?? "Manager"} rejected "${goal.title}". ${comment ?? ""}`.trim(),
      link: "/employee/goals",
    },
  });

  await invalidateUserCaches(employee.id);
  await invalidateUserCaches(managerId);

  // Publish real-time event so SSE clients can react immediately
  await publish(`events:${employee.id}`, { type: `GOAL_${status}`, goalId });
  await publish(`events:${managerId}`, { type: "GOAL_DECIDED", goalId });

  return toGoalWithOwner(goal as PrismaGoalWithEmployee);
}

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

export async function addCheckIn(actorId: string, input: CheckInInput): Promise<CheckIn> {
  const goal = await prisma.goal.findUnique({ where: { id: input.goalId } });
  if (!goal) throw new Error("Goal not found.");
  const employee = await prisma.user.findUnique({ where: { id: goal.employeeId } });
  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!employee || !actor) throw new Error("User not found.");

  // GAP 4 FIX: Enforce check-in window — only allow if current date is within the quarter window
  if (actor.role !== "ADMIN") {
    const cycle = await prisma.goalCycle.findUnique({ where: { id: goal.cycleId } });
    if (cycle) {
      const windowKey = `${input.quarter.toLowerCase()}Window` as "q1Window" | "q2Window" | "q3Window" | "q4Window";
      const window = cycle[windowKey] as { start: string; end: string } | null;
      if (window) {
        const now = new Date();
        const windowStart = new Date(window.start);
        const windowEnd = new Date(window.end);
        if (now < windowStart || now > windowEnd) {
          throw new Error(`${input.quarter} check-in window is not open. It runs from ${windowStart.toLocaleDateString()} to ${windowEnd.toLocaleDateString()}.`);
        }
      }
    }
  }

  const managerId = actor.role === "MANAGER" ? actor.id : employee.managerId;
  if (!managerId) throw new Error("A manager is required for check-ins.");
  if (actor.role === "EMPLOYEE" && actor.id !== employee.id) throw new Error("Employees can only update their own check-ins.");
  if (actor.role === "MANAGER" && employee.managerId !== actor.id) throw new Error("Managers can only check in direct reports.");

  const progressScore = calculateProgress(goal.uomType, goal.target, input.actualValue, goal.targetDate, new Date());

  const checkIn = await prisma.checkIn.create({
    data: {
      employeeId: employee.id,
      managerId,
      goalId: goal.id,
      quarter: input.quarter,
      comments: sanitize(input.comments),
      plannedValue: input.plannedValue,
      actualValue: input.actualValue,
      progressScore,
    },
  });

  // Update goal progress + quarterly achievement
  const achievementUpdate = { planned: input.plannedValue, actual: input.actualValue, status: deriveAchievementStatus(progressScore), updatedAt: new Date().toISOString() };
  const achievements = (goal.achievements as Goal["achievements"]).map((a) =>
    a.quarter === input.quarter ? { ...a, ...achievementUpdate } : a,
  );
  await prisma.goal.update({ where: { id: goal.id }, data: { currentProgress: progressScore, lastUpdatedAt: new Date(), achievements: achievements as unknown as Prisma.InputJsonValue[] } });

  // GAP 3 FIX: If this is a shared goal with a primary owner, sync achievements to all linked copies
  if (goal.isShared && goal.primaryOwnerId === goal.employeeId && goal.sharedWith.length > 0) {
    const linkedGoals = await prisma.goal.findMany({
      where: { title: goal.title, employeeId: { in: goal.sharedWith }, cycleId: goal.cycleId },
      select: { id: true, achievements: true },
    });
    for (const linked of linkedGoals) {
      const linkedAchievements = (linked.achievements as Goal["achievements"]).map((a) =>
        a.quarter === input.quarter ? { ...a, ...achievementUpdate } : a,
      );
      await prisma.goal.update({ where: { id: linked.id }, data: { currentProgress: progressScore, lastUpdatedAt: new Date(), achievements: linkedAchievements as unknown as Prisma.InputJsonValue[] } });
    }
  }

  await prisma.auditLog.create({ data: { goalId: goal.id, userId: actorId, action: "CHECKED_IN", field: "currentProgress", newValue: String(progressScore) } });
  await prisma.notification.create({
    data: {
      userId: actor.role === "MANAGER" ? employee.id : managerId,
      type: "CHECK_IN_ADDED",
      title: "New check-in",
      message: `${actor.name} added a ${input.quarter} check-in for "${goal.title}".`,
      link: actor.role === "MANAGER" ? "/employee/check-ins" : "/manager/team",
    },
  });

  await invalidateUserCaches(employee.id);
  await invalidateUserCaches(managerId);

  await publish(`events:${employee.id}`, { type: "CHECK_IN_ADDED", goalId: goal.id });
  await publish(`events:${managerId}`, { type: "CHECK_IN_ADDED", goalId: goal.id });

  return toCheckIn(checkIn);
}

export async function listCheckIns(userId: string): Promise<CheckIn[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, id: true } });
  if (!user) throw new Error("User not found.");

  let where: Prisma.CheckInWhereInput = {};
  if (user.role === "EMPLOYEE") {
    where = { OR: [{ employeeId: userId }, { managerId: userId }] };
  } else if (user.role === "MANAGER") {
    const directReportIds = (await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })).map((u) => u.id);
    where = { OR: [{ employeeId: userId }, { managerId: userId }, { employeeId: { in: directReportIds } }] };
  }
  // ADMIN sees all — where stays {}

  const checkIns = await prisma.checkIn.findMany({ where, orderBy: { createdAt: "desc" } });
  return checkIns.map(toCheckIn);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function listNotifications(userId: string): Promise<Notification[]> {
  const notifications = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return notifications.map(toNotification);
}

export async function markNotificationsRead(userId: string): Promise<Notification[]> {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
  return listNotifications(userId);
}

// ---------------------------------------------------------------------------
// Analytics (with Redis caching)
// ---------------------------------------------------------------------------

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const cached = await getCachedJson<DashboardSummary>(`dashboard:${userId}`);
  if (cached) return cached;

  const goals = await listGoalsForUser(userId);
  const unreadNotifications = await prisma.notification.count({ where: { userId, isRead: false } });

  const summary: DashboardSummary = {
    totalGoals: goals.length,
    approvedGoals: goals.filter((g) => g.status === "APPROVED").length,
    submittedGoals: goals.filter((g) => g.status === "SUBMITTED").length,
    atRiskGoals: goals.filter((g) => g.achievements.some((a) => a.status === "AT_RISK")).length,
    averageProgress: average(goals.map((g) => g.currentProgress)),
    totalWeightage: goals.filter((g) => g.employeeId === userId).reduce((sum, g) => sum + g.weightage, 0),
    unreadNotifications,
  };

  await setCachedJson(`dashboard:${userId}`, summary, 60);
  return summary;
}

export async function getTeamAnalytics(userId: string): Promise<TeamAnalytics[]> {
  const cached = await getCachedJson<TeamAnalytics[]>(`team-analytics:${userId}`);
  if (cached) return cached;

  const goals = await listGoalsForUser(userId);
  const departments = new Map<string, GoalWithOwner[]>();
  for (const goal of goals) {
    const dept = goal.employee.department ?? "Unassigned";
    departments.set(dept, [...(departments.get(dept) ?? []), goal]);
  }

  const result = [...departments.entries()].map(([department, deptGoals]) => ({
    department,
    averageProgress: average(deptGoals.map((g) => g.currentProgress)),
    approvedRate: deptGoals.length ? Math.round((deptGoals.filter((g) => g.status === "APPROVED").length / deptGoals.length) * 100) : 0,
    employeeCount: new Set(deptGoals.map((g) => g.employeeId)).size,
    atRiskCount: deptGoals.filter((g) => g.achievements.some((a) => a.status === "AT_RISK")).length,
  }));

  await setCachedJson(`team-analytics:${userId}`, result, 120);
  return result;
}

export async function getLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  const cached = await getCachedJson<LeaderboardEntry[]>(`leaderboard:${userId}`);
  if (cached) return cached;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, id: true } });
  if (!user) throw new Error("User not found.");

  let visibleUsersWhere: Prisma.UserWhereInput = {};
  if (user.role === "ADMIN") visibleUsersWhere = { role: "EMPLOYEE" };
  else if (user.role === "MANAGER") visibleUsersWhere = { managerId: userId };
  else visibleUsersWhere = { id: userId };

  const visibleUsers = await prisma.user.findMany({ where: visibleUsersWhere, select: { id: true, name: true, department: true, streakCount: true } });

  const entries: LeaderboardEntry[] = [];
  for (const emp of visibleUsers) {
    const goals = await prisma.goal.findMany({ where: { employeeId: emp.id }, select: { currentProgress: true } });
    const progress = average(goals.map((g) => g.currentProgress));
    entries.push({
      employeeId: emp.id,
      name: emp.name,
      department: emp.department ?? "Unassigned",
      progress,
      badge: progress >= 95 ? "Platinum" : progress >= 80 ? "Gold" : progress >= 60 ? "Silver" : "Bronze",
      streakCount: emp.streakCount,
    });
  }

  entries.sort((a, b) => b.progress - a.progress);
  await setCachedJson(`leaderboard:${userId}`, entries, 120);
  return entries;
}

export async function getAuditLogs(userId: string): Promise<AuditLog[]> {
  const visibleGoals = await listGoalsForUser(userId);
  const goalIds = visibleGoals.map((g) => g.id);
  const logs = await prisma.auditLog.findMany({ where: { goalId: { in: goalIds } }, orderBy: { timestamp: "desc" } });
  return logs.map(toAuditLog);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export async function getGoalExportRows(userId: string) {
  const goals = await listGoalsForUser(userId);
  return goals.map((goal) => ({
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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function notifyManagers(employeeId: string, type: string, title: string, message: string, link: string) {
  const employee = await prisma.user.findUnique({ where: { id: employeeId }, select: { managerId: true } });
  if (!employee?.managerId) return;
  await prisma.notification.create({
    data: { userId: employee.managerId, type, title, message, link },
  });
}

function average(values: number[]): number {
  const nums = values.filter(Number.isFinite);
  if (!nums.length) return 0;
  return Number((nums.reduce((s, v) => s + v, 0) / nums.length).toFixed(1));
}

// ---------------------------------------------------------------------------
// Shared Goals
// ---------------------------------------------------------------------------

export async function shareGoal(actorId: string, goalId: string, sharedWith: string[]): Promise<GoalWithOwner> {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new Error("Goal not found.");
  if (goal.employeeId !== actorId) throw new Error("Only the goal owner can share it.");
  if (goal.isLocked || goal.status === "APPROVED") throw new Error("Approved goals cannot be changed.");

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: {
      isShared: sharedWith.length > 0,
      primaryOwnerId: sharedWith.length > 0 ? actorId : null,
      sharedWith,
    },
    include: { employee: { select: employeeSelect } },
  });

  await prisma.auditLog.create({ data: { goalId, userId: actorId, action: "SHARED", field: "sharedWith", newValue: sharedWith.join(",") } });

  for (const peerId of sharedWith) {
    await prisma.notification.create({
      data: {
        userId: peerId,
        type: "GOAL_SHARED",
        title: "Goal shared with you",
        message: `${updated.employee.name} shared the goal "${updated.title}" with you.`,
        link: "/employee/goals",
      },
    });
    await publish(`events:${peerId}`, { type: "GOAL_SHARED", goalId });
  }

  await invalidateUserCaches(actorId);
  return toGoalWithOwner(updated as PrismaGoalWithEmployee);
}

export async function listPeers(userId: string): Promise<Pick<User, "id" | "name" | "email" | "department" | "designation">[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true, role: true } });
  if (!user) return [];

  // Peers = teammates who share the same manager, excluding self
  const where = user.managerId
    ? { managerId: user.managerId, id: { not: userId } }
    : { id: { not: userId }, role: "EMPLOYEE" as const };

  const peers = await prisma.user.findMany({ where, select: { id: true, name: true, email: true, department: true, designation: true } });
  return peers.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    department: p.department ?? null,
    designation: p.designation ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Predictive Analytics
// ---------------------------------------------------------------------------

export async function getGoalPredictions(userId: string): Promise<GoalPrediction[]> {
  const goals = await prisma.goal.findMany({
    where: { OR: [{ employeeId: userId }, { sharedWith: { has: userId } }] },
    select: { id: true, title: true, currentProgress: true, createdAt: true, achievements: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const now = new Date();
  // FY start: April 1 of the current fiscal year (AtomQuest uses Apr-Mar FY)
  const fyStart = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);
  const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
  const totalMs = fyEnd.getTime() - fyStart.getTime();
  const elapsedMs = Math.max(now.getTime() - fyStart.getTime(), 1);
  const elapsedFraction = Math.min(elapsedMs / totalMs, 1);

  return goals.map((goal) => {
    const current = goal.currentProgress;
    const velocityPerMonth = elapsedFraction > 0 ? current / (elapsedFraction * 12) : 0;
    const remainingMonths = (1 - elapsedFraction) * 12;
    const projected = Math.min(current + velocityPerMonth * remainingMonths, 100);
    const onTrack = projected >= 95;

    // Build monthly data points for the chart
    const months: GoalPrediction["monthlyData"] = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(fyStart.getFullYear(), fyStart.getMonth() + i, 1);
      const monthLabel = format(monthDate, "MMM");
      const monthFraction = (i + 1) / 12;
      const isPast = monthDate <= now;
      const pctAtMonth = Math.min(velocityPerMonth * (i + 1), 100);
      months.push({
        month: monthLabel,
        actual: isPast ? Math.min(current * (monthFraction / elapsedFraction), current) : null,
        projected: Number(pctAtMonth.toFixed(1)),
      });
    }

    return {
      goalId: goal.id,
      title: goal.title,
      currentProgress: Number(current.toFixed(1)),
      predictedProgress: Number(projected.toFixed(1)),
      onTrackToComplete: onTrack,
      monthlyData: months,
    };
  });
}

// ---------------------------------------------------------------------------
// Escalations
// ---------------------------------------------------------------------------

function toEscalation(e: NonNullable<Awaited<ReturnType<typeof prisma.escalation.findFirst>>>): Escalation {
  return {
    id: e.id,
    type: e.type as Escalation["type"],
    employeeId: e.employeeId,
    managerId: e.managerId ?? null,
    escalationLevel: e.escalationLevel,
    dueDate: e.dueDate.toISOString(),
    resolved: e.resolved,
    resolvedAt: e.resolvedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function listEscalations(userId: string): Promise<Escalation[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, id: true } });
  if (!user) throw new Error("User not found.");

  let where: Record<string, unknown> = {};
  if (user.role === "EMPLOYEE") where = { employeeId: userId };
  else if (user.role === "MANAGER") where = { managerId: userId };
  // ADMIN sees all

  const escalations = await prisma.escalation.findMany({ where, orderBy: { createdAt: "desc" } });

  // Enrich with employee names
  const employeeIds = [...new Set(escalations.map((e) => e.employeeId))];
  const employees = await prisma.user.findMany({ where: { id: { in: employeeIds } }, select: { id: true, name: true } });
  const nameMap = new Map(employees.map((u) => [u.id, u.name]));

  return escalations.map((e) => ({ ...toEscalation(e), employeeName: nameMap.get(e.employeeId) ?? "Unknown" }));
}

export async function createEscalation(data: {
  type: Escalation["type"];
  employeeId: string;
  managerId?: string;
  dueDate: Date;
  escalationLevel?: number;
}): Promise<Escalation> {
  const existing = await prisma.escalation.findFirst({
    where: { employeeId: data.employeeId, type: data.type, resolved: false },
  });
  if (existing) return toEscalation(existing);

  const e = await prisma.escalation.create({
    data: {
      type: data.type,
      employeeId: data.employeeId,
      managerId: data.managerId,
      dueDate: data.dueDate,
      escalationLevel: data.escalationLevel ?? 1,
    },
  });

  if (data.managerId) {
    await prisma.notification.create({
      data: {
        userId: data.managerId,
        type: "ESCALATION_CREATED",
        title: "New escalation",
        message: `An escalation of type "${data.type}" has been raised for your direct report.`,
        link: "/manager/escalations",
      },
    });
    await publish(`events:${data.managerId}`, { type: "ESCALATION_CREATED" });
  }

  return toEscalation(e);
}

export async function resolveEscalation(escalationId: string, actorId: string, actorRole: string = "MANAGER"): Promise<Escalation> {
  const existing = await prisma.escalation.findUnique({ where: { id: escalationId } });
  if (!existing) throw new Error("Escalation not found.");
  if (actorRole !== "ADMIN" && existing.managerId !== actorId) {
    throw new Error("Only the assigned manager can resolve this escalation.");
  }
  const e = await prisma.escalation.update({
    where: { id: escalationId },
    data: { resolved: true, resolvedAt: new Date() },
  });
  await prisma.notification.create({
    data: {
      userId: e.employeeId,
      type: "ESCALATION_RESOLVED",
      title: "Escalation resolved",
      message: "A pending escalation on your account has been resolved.",
      link: "/employee/goals",
    },
  });
  await publish(`events:${e.employeeId}`, { type: "ESCALATION_RESOLVED" });
  return toEscalation(e);
}

export async function autoEscalateUnsubmitted(): Promise<void> {
  const threeDaysAgo = addDays(new Date(), -3);
  const employees = await prisma.user.findMany({ where: { role: "EMPLOYEE" }, select: { id: true, managerId: true } });

  for (const emp of employees) {
    const hasSubmitted = await prisma.goal.findFirst({
      where: { employeeId: emp.id, status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] } },
    });
    if (!hasSubmitted) {
      const hasDraftOlderThan3Days = await prisma.goal.findFirst({
        where: { employeeId: emp.id, status: "DRAFT", createdAt: { lte: threeDaysAgo } },
      });
      if (hasDraftOlderThan3Days) {
        await createEscalation({
          type: "GOAL_NOT_SUBMITTED",
          employeeId: emp.id,
          managerId: emp.managerId ?? undefined,
          dueDate: addDays(new Date(), 2),
        });
      }
    }
  }
}
