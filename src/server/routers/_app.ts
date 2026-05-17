import { createTRPCRouter } from "@/server/trpc";
import { adminRouter } from "@/server/routers/admin";
import { analyticsRouter } from "@/server/routers/analytics";
import { checkInsRouter } from "@/server/routers/check-ins";
import { escalationsRouter } from "@/server/routers/escalations";
import { goalsRouter } from "@/server/routers/goals";
import { notificationsRouter } from "@/server/routers/notifications";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  analytics: analyticsRouter,
  checkIns: checkInsRouter,
  escalations: escalationsRouter,
  goals: goalsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
