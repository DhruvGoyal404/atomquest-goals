import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  listNotifications,
  markNotificationsRead,
} from "@/server/services/db-store";

export const notificationsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
  markAllRead: protectedProcedure.mutation(({ ctx }) => markNotificationsRead(ctx.user.id)),
});
