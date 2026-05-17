import { checkInSchema } from "@/lib/validations/goal.validation";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  addCheckIn,
  listCheckIns,
} from "@/server/services/db-store";

export const checkInsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listCheckIns(ctx.user.id)),
  add: protectedProcedure.input(checkInSchema).mutation(({ ctx, input }) => addCheckIn(ctx.user.id, input)),
});
