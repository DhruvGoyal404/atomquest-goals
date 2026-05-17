import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  getAuditLogs,
  getDashboardSummary,
  getGoalPredictions,
  getLeaderboard,
  getTeamAnalytics,
} from "@/server/services/db-store";

export const analyticsRouter = createTRPCRouter({
  summary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.id)),
  team: protectedProcedure.query(({ ctx }) => getTeamAnalytics(ctx.user.id)),
  leaderboard: protectedProcedure.query(({ ctx }) => getLeaderboard(ctx.user.id)),
  audit: protectedProcedure.query(({ ctx }) => getAuditLogs(ctx.user.id)),
  predictions: protectedProcedure.query(({ ctx }) => getGoalPredictions(ctx.user.id)),
});
