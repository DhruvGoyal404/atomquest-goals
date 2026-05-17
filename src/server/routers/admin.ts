import { cycleSchema } from "@/lib/validations/goal.validation";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import {
  createCycle,
  listCycles,
  listUsers,
} from "@/server/services/db-store";

export const adminRouter = createTRPCRouter({
  users: adminProcedure.query(() => listUsers()),
  cycles: adminProcedure.query(() => listCycles()),
  createCycle: adminProcedure.input(cycleSchema).mutation(({ input }) => createCycle(input)),
});
