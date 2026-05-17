import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, managerProcedure, protectedProcedure } from "@/server/trpc";
import {
  autoEscalateUnsubmitted,
  createEscalation,
  getUserById,
  listEscalations,
  resolveEscalation,
} from "@/server/services/db-store";
import { addDays } from "date-fns";

export const escalationsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listEscalations(ctx.user.id)),

  create: managerProcedure
    .input(
      z.object({
        type: z.enum(["GOAL_NOT_SUBMITTED", "GOAL_NOT_APPROVED", "CHECKIN_OVERDUE"]),
        employeeId: z.string().min(1),
        daysUntilDue: z.number().int().min(1).max(30).default(3),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "ADMIN") {
        const employee = await getUserById(input.employeeId);
        if (!employee || employee.managerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This employee is not in your team." });
        }
      }
      return createEscalation({
        type: input.type,
        employeeId: input.employeeId,
        managerId: ctx.user.id,
        dueDate: addDays(new Date(), input.daysUntilDue),
      });
    }),

  resolve: managerProcedure
    .input(z.object({ escalationId: z.string().min(1) }))
    .mutation(({ ctx, input }) => resolveEscalation(input.escalationId, ctx.user.id, ctx.user.role)),

  autoDetect: managerProcedure.mutation(() => autoEscalateUnsubmitted()),
});
