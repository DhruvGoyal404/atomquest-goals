import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { getUserById } from "@/server/services/db-store";
import { getDemoUserById } from "@/server/services/demo-store";
import { assertRateLimit } from "@/server/middleware/rate-limit";
import type { User } from "@/types/domain";

export async function createTRPCContext() {
  const session = await auth();
  let user: User | undefined;

  if (session?.user?.id) {
    const id = session.user.id;
    // Only query MongoDB if id looks like a valid 24-char hex ObjectID
    // (stale JWTs from older builds had string IDs like "demo-employee" which crash Prisma)
    if (/^[a-f0-9]{24}$/i.test(id)) {
      try {
        user = await getUserById(id);
      } catch {
        // DB offline — fall through to demo-store below
      }
    }
    if (!user) user = getDemoUserById(id);
    await assertRateLimit(id);
  }

  return {
    session,
    user,
  };
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in to continue.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    },
  });
});

export const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["MANAGER", "ADMIN"].includes(ctx.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Manager access is required.",
    });
  }

  return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access is required.",
    });
  }

  return next({ ctx });
});
