import { z } from "zod";

export const uomTypeSchema = z.enum([
  "MIN_NUMERIC",
  "MAX_NUMERIC",
  "MIN_PERCENTAGE",
  "MAX_PERCENTAGE",
  "TIMELINE",
  "ZERO",
]);

export const quarterSchema = z.enum(["Q1", "Q2", "Q3", "Q4"]);

export const goalSchema = z
  .object({
    id: z.string().optional(),
    thrustArea: z.string().trim().min(1, "Thrust area is required").max(80),
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(140),
    description: z.string().trim().max(1200).optional().or(z.literal("")),
    uomType: uomTypeSchema,
    target: z.coerce.number().positive("Target must be positive"),
    targetDate: z.coerce.date().optional().nullable(),
    weightage: z.coerce
      .number()
      .int()
      .min(10, "Minimum weightage is 10%")
      .max(100, "Maximum weightage is 100%"),
    isShared: z.boolean().default(false),
    sharedWith: z.array(z.string()).default([]),
  })
  .superRefine((goal, ctx) => {
    if (goal.uomType === "TIMELINE" && !goal.targetDate) {
      ctx.addIssue({
        code: "custom",
        message: "Target date is required for timeline goals",
        path: ["targetDate"],
      });
    }

    if (goal.uomType === "ZERO" && goal.target !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Zero-defect goals use a target of 1",
        path: ["target"],
      });
    }
  });

export const goalSheetSchema = z
  .object({
    goals: z.array(goalSchema).min(1, "At least one goal is required").max(8, "Maximum 8 goals allowed"),
  })
  .refine(
    (data) => {
      const totalWeightage = data.goals.reduce((sum, goal) => sum + goal.weightage, 0);
      return totalWeightage === 100;
    },
    {
      message: "Total weightage must equal exactly 100%",
      path: ["goals"],
    },
  );

export const createGoalInputSchema = goalSchema.safeExtend({
  employeeId: z.string().optional(),
});

export const updateGoalInputSchema = goalSchema.safeExtend({
  id: z.string().min(1),
});

export const submitGoalsInputSchema = z.object({
  employeeId: z.string().optional(),
});

export const approvalInputSchema = z.object({
  goalId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().max(700).optional(),
});

export const checkInSchema = z.object({
  goalId: z.string().min(1),
  quarter: quarterSchema,
  comments: z.string().trim().min(5, "Add a meaningful check-in comment").max(1200),
  plannedValue: z.coerce.number().min(0),
  actualValue: z.coerce.number().min(0),
});

export const cycleSchema = z.object({
  name: z.string().trim().min(4).max(60),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(false),
});

export const aiSuggestionInputSchema = z.object({
  department: z.string().min(2).max(80),
  designation: z.string().min(2).max(80),
});

export type GoalFormInput = z.infer<typeof goalSchema>;
export type GoalSheetInput = z.infer<typeof goalSheetSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
