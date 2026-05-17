"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lightbulb, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/components/providers/trpc-provider";
import { goalSchema, type GoalFormInput } from "@/lib/validations/goal.validation";

const uomOptions = ["MIN_NUMERIC", "MAX_NUMERIC", "MIN_PERCENTAGE", "MAX_PERCENTAGE", "TIMELINE", "ZERO"] as const;

export function GoalForm() {
  const utils = trpc.useUtils();
  const suggestions = trpc.goals.suggest.useQuery({
    department: "Product Engineering",
    designation: "Senior Software Engineer",
  });
  const createGoal = trpc.goals.create.useMutation({
    onSuccess: async () => {
      toast.success("Goal added");
      await Promise.all([
        utils.goals.mine.invalidate(),
        utils.goals.list.invalidate(),
        utils.analytics.summary.invalidate(),
      ]);
      form.reset(defaultValues);
    },
    onError: (error) => toast.error(error.message),
  });
  const form = useForm<GoalFormRaw, unknown, GoalFormInput>({
    resolver: zodResolver(goalSchema),
    defaultValues,
  });
  const uomType = form.watch("uomType");

  useEffect(() => {
    if (uomType === "ZERO") {
      form.setValue("target", 1);
    }
  }, [form, uomType]);

  function applySuggestion(index: number) {
    const suggestion = suggestions.data?.[index];
    if (!suggestion) {
      return;
    }

    form.setValue("thrustArea", suggestion.thrustArea);
    form.setValue("title", suggestion.title);
    form.setValue("description", suggestion.description ?? "");
    form.setValue("uomType", suggestion.uomType);
    form.setValue("target", suggestion.target);
    form.setValue("weightage", suggestion.weightage);
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Create goal</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={form.handleSubmit((values) => createGoal.mutate(values))}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Thrust area" error={form.formState.errors.thrustArea?.message}>
              <Input {...form.register("thrustArea")} placeholder="Platform Reliability" />
            </Field>
            <Field label="Weightage" error={form.formState.errors.weightage?.message}>
              <Input type="number" min={10} max={100} {...form.register("weightage", { valueAsNumber: true })} />
            </Field>
          </div>
          <Field label="Title" error={form.formState.errors.title?.message}>
            <Input {...form.register("title")} placeholder="Reduce checkout API p95 latency" />
          </Field>
          <Field label="Description" error={form.formState.errors.description?.message}>
            <Textarea {...form.register("description")} placeholder="Key actions, dependencies, and expected business impact" />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="UoM type" error={form.formState.errors.uomType?.message}>
              <Select value={uomType} onValueChange={(value) => form.setValue("uomType", value as GoalFormInput["uomType"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uomOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Target" error={form.formState.errors.target?.message}>
              <Input type="number" step="0.1" {...form.register("target", { valueAsNumber: true })} disabled={uomType === "ZERO"} />
            </Field>
            <Field label="Target date" error={form.formState.errors.targetDate?.message}>
              <Input
                type="date"
                {...form.register("targetDate", {
                  setValueAs: (value: string) => (value ? new Date(value) : undefined),
                })}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={createGoal.isPending}>
              <Plus />
              {createGoal.isPending ? "Creating..." : "Create goal"}
            </Button>
            {suggestions.data?.slice(0, 3).map((suggestion, index) => (
              <Button key={suggestion.title} type="button" variant="outline" onClick={() => applySuggestion(index)}>
                <Lightbulb />
                Suggestion {index + 1}
              </Button>
            ))}
          </div>
          {createGoal.error ? <p className="text-sm text-destructive">{createGoal.error.message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

type GoalFormRaw = z.input<typeof goalSchema>;

const defaultValues: GoalFormRaw = {
  thrustArea: "",
  title: "",
  description: "",
  uomType: "MIN_NUMERIC",
  target: 1,
  targetDate: undefined,
  weightage: 10,
  isShared: false,
  sharedWith: [],
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
