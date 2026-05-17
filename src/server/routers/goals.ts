import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  approvalInputSchema,
  aiSuggestionInputSchema,
  createGoalInputSchema,
  submitGoalsInputSchema,
  updateGoalInputSchema,
} from "@/lib/validations/goal.validation";
import { sendGoalApprovalEmail } from "@/lib/integrations/email";
import { sendTeamsNotification } from "@/lib/integrations/microsoft-teams";
import { createTRPCRouter, managerProcedure, protectedProcedure } from "@/server/trpc";
import {
  createGoal,
  decideGoal,
  getUserById,
  getGoalExportRows,
  listEmployeeGoals,
  listGoalsForUser,
  listPeers,
  listTeamGoals,
  shareGoal,
  submitGoals,
  updateGoal,
} from "@/server/services/db-store";
import { suggestGoals } from "@/server/services/ai-goals";

export const goalsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listGoalsForUser(ctx.user.id)),
  mine: protectedProcedure.query(({ ctx }) => listEmployeeGoals(ctx.user.id)),
  byEmployee: managerProcedure.input(z.object({ employeeId: z.string() })).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "ADMIN") {
      const employee = await getUserById(input.employeeId);
      if (!employee || employee.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This employee is not in your team." });
      }
    }
    return listEmployeeGoals(input.employeeId);
  }),
  team: managerProcedure.query(({ ctx }) => (ctx.user.role === "ADMIN" ? listGoalsForUser(ctx.user.id) : listTeamGoals(ctx.user.id))),
  exportRows: protectedProcedure.query(({ ctx }) => getGoalExportRows(ctx.user.id)),
  create: protectedProcedure.input(createGoalInputSchema).mutation(({ ctx, input }) => {
    if (ctx.user.role !== "EMPLOYEE") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only employees can create personal goals in this workflow.",
      });
    }

    return createGoal(ctx.user.id, input);
  }),
  update: protectedProcedure.input(updateGoalInputSchema).mutation(({ ctx, input }) => updateGoal(ctx.user.id, input)),
  submit: protectedProcedure.input(submitGoalsInputSchema).mutation(({ ctx }) => submitGoals(ctx.user.id)),
  decide: managerProcedure.input(approvalInputSchema).mutation(async ({ ctx, input }) => {
    const goal = await decideGoal(ctx.user.id, input.goalId, input.decision, input.comment);
    const employee = await getUserById(goal.employeeId);

    if (employee && input.decision === "APPROVED") {
      await Promise.allSettled([
        sendGoalApprovalEmail(employee.email, goal.title, ctx.user.name),
        sendTeamsNotification(employee.azureAdId ?? employee.email, `${ctx.user.name} approved "${goal.title}".`, `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/employee/goals`),
      ]);
    }

    return goal;
  }),
  suggest: protectedProcedure.input(aiSuggestionInputSchema).query(({ input }) => suggestGoals(input.department, input.designation)),
  peers: protectedProcedure.query(({ ctx }) => listPeers(ctx.user.id)),
  share: protectedProcedure
    .input(z.object({ goalId: z.string().min(1), sharedWith: z.array(z.string()) }))
    .mutation(({ ctx, input }) => shareGoal(ctx.user.id, input.goalId, input.sharedWith)),
});
