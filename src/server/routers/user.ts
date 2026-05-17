import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { updateUserProfile } from "@/server/services/db-store";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => ctx.user),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(80).optional(),
        designation: z.string().max(80).nullable().optional(),
        image: z.string().url("Must be a valid URL").nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
});
