import { z } from "zod";
import { cycleSchema } from "@/lib/validations/goal.validation";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import {
  adminUnlockGoal,
  createCycle,
  listCycles,
  listLockedGoals,
  listUsers,
} from "@/server/services/db-store";

export const adminRouter = createTRPCRouter({
  users: adminProcedure.query(() => listUsers()),
  cycles: adminProcedure.query(() => listCycles()),
  lockedGoals: adminProcedure.query(() => listLockedGoals()),
  createCycle: adminProcedure.input(cycleSchema).mutation(({ input }) => createCycle(input)),
  unlockGoal: adminProcedure
    .input(z.object({ goalId: z.string().min(1) }))
    .mutation(({ ctx, input }) => adminUnlockGoal(ctx.user.id, input.goalId)),
});
