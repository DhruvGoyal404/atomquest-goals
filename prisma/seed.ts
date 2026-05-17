import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getSeedSnapshot } from "../src/server/services/demo-store";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "demo123";

async function main() {
  const seed = getSeedSnapshot();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  console.log("Clearing existing data...");
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalCycle.deleteMany();
  await prisma.escalation.deleteMany();
  // Null out self-referential managerId before deleting to avoid relation constraint error
  await prisma.user.updateMany({ data: { managerId: null } });
  await prisma.user.deleteMany();

  console.log("Seeding users with bcrypt-hashed passwords...");
  await prisma.user.createMany({
    data: seed.users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      managerId: user.managerId ?? undefined,
      department: user.department ?? undefined,
      designation: user.designation ?? undefined,
      employeeCode: user.employeeCode ?? undefined,
      azureAdId: user.azureAdId ?? undefined,
      azureAdEmail: user.email,
      passwordHash,
      streakCount: user.streakCount,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    })),
  });

  console.log("Seeding goal cycles...");
  await prisma.goalCycle.createMany({
    data: seed.cycles.map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      startDate: new Date(cycle.startDate),
      endDate: new Date(cycle.endDate),
      q1Window: cycle.q1Window as Prisma.InputJsonValue,
      q2Window: cycle.q2Window as Prisma.InputJsonValue,
      q3Window: cycle.q3Window as Prisma.InputJsonValue,
      q4Window: cycle.q4Window as Prisma.InputJsonValue,
      isActive: cycle.isActive,
    })),
  });

  console.log("Seeding goals...");
  await prisma.goal.createMany({
    data: seed.goals.map((goal) => ({
      id: goal.id,
      employeeId: goal.employeeId,
      cycleId: goal.cycleId,
      thrustArea: goal.thrustArea,
      title: goal.title,
      description: goal.description ?? undefined,
      uomType: goal.uomType,
      target: goal.target,
      targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
      weightage: goal.weightage,
      status: goal.status,
      isLocked: goal.isLocked,
      lockedAt: goal.lockedAt ? new Date(goal.lockedAt) : undefined,
      lockedBy: goal.lockedBy ?? undefined,
      isShared: goal.isShared,
      primaryOwnerId: goal.primaryOwnerId ?? undefined,
      sharedWith: goal.sharedWith,
      currentProgress: goal.currentProgress,
      lastUpdatedAt: goal.lastUpdatedAt ? new Date(goal.lastUpdatedAt) : undefined,
      achievements: goal.achievements as unknown as Prisma.InputJsonValue[],
      createdAt: new Date(goal.createdAt),
      updatedAt: new Date(goal.updatedAt),
    })),
  });

  console.log("Seeding check-ins...");
  await prisma.checkIn.createMany({
    data: seed.checkIns.map((checkIn) => ({
      id: checkIn.id,
      employeeId: checkIn.employeeId,
      managerId: checkIn.managerId,
      goalId: checkIn.goalId,
      quarter: checkIn.quarter,
      comments: checkIn.comments,
      plannedValue: checkIn.plannedValue,
      actualValue: checkIn.actualValue,
      progressScore: checkIn.progressScore,
      checkInDate: new Date(checkIn.checkInDate),
      createdAt: new Date(checkIn.createdAt),
      updatedAt: new Date(checkIn.updatedAt),
    })),
  });

  console.log("Seeding notifications...");
  await prisma.notification.createMany({
    data: seed.notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link ?? undefined,
      isRead: notification.isRead,
      readAt: notification.readAt ? new Date(notification.readAt) : undefined,
      createdAt: new Date(notification.createdAt),
    })),
  });

  console.log("Seeding audit logs...");
  await prisma.auditLog.createMany({
    data: seed.auditLogs.map((log) => ({
      id: log.id,
      goalId: log.goalId,
      userId: log.userId,
      action: log.action,
      field: log.field ?? undefined,
      oldValue: log.oldValue ?? undefined,
      newValue: log.newValue ?? undefined,
      timestamp: new Date(log.timestamp),
    })),
  });

  console.log("Seeding escalations...");
  await prisma.escalation.createMany({
    data: seed.escalations.map((esc) => ({
      id: esc.id,
      type: esc.type,
      employeeId: esc.employeeId,
      managerId: esc.managerId ?? undefined,
      escalationLevel: esc.escalationLevel,
      dueDate: new Date(esc.dueDate),
      resolved: esc.resolved,
      resolvedAt: esc.resolvedAt ? new Date(esc.resolvedAt) : undefined,
      createdAt: new Date(esc.createdAt),
      updatedAt: new Date(esc.updatedAt),
    })),
  });

  console.log(`✅ Seeded ${seed.users.length} users, ${seed.goals.length} goals, ${seed.checkIns.length} check-ins, and ${seed.escalations.length} escalations.`);
  console.log(`   All users have password: "${DEMO_PASSWORD}" (bcrypt hashed)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
