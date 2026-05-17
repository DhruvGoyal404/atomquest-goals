"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquarePlus } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/components/providers/trpc-provider";
import { checkInSchema, type CheckInInput } from "@/lib/validations/goal.validation";
import { formatDate, formatPercent } from "@/lib/utils/format";
import type { Quarter } from "@/types/domain";

const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export function CheckInPanel() {
  const utils = trpc.useUtils();
  const goals = trpc.goals.list.useQuery();
  const checkIns = trpc.checkIns.list.useQuery();
  const addCheckIn = trpc.checkIns.add.useMutation({
    onSuccess: async () => {
      toast.success("Check-in recorded");
      await Promise.all([
        utils.checkIns.list.invalidate(),
        utils.goals.list.invalidate(),
        utils.goals.mine.invalidate(),
        utils.analytics.summary.invalidate(),
      ]);
      form.reset(defaultValues);
    },
    onError: (error) => toast.error(error.message),
  });
  const form = useForm<CheckInRaw, unknown, CheckInInput>({
    resolver: zodResolver(checkInSchema),
    defaultValues,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Quarterly execution</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">Check-ins</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Update planned and actual values; progress is calculated from the goal UoM.</p>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Add check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={form.handleSubmit((values) => addCheckIn.mutate(values))}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Goal" error={form.formState.errors.goalId?.message}>
                <Select value={form.watch("goalId")} onValueChange={(value) => form.setValue("goalId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.data?.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Quarter" error={form.formState.errors.quarter?.message}>
                <Select value={form.watch("quarter")} onValueChange={(value) => form.setValue("quarter", value as Quarter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quarters.map((quarter) => (
                      <SelectItem key={quarter} value={quarter}>
                        {quarter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Planned value" error={form.formState.errors.plannedValue?.message}>
                <Input type="number" step="0.1" {...form.register("plannedValue", { valueAsNumber: true })} />
              </Field>
              <Field label="Actual value" error={form.formState.errors.actualValue?.message}>
                <Input type="number" step="0.1" {...form.register("actualValue", { valueAsNumber: true })} />
              </Field>
            </div>
            <Field label="Comments" error={form.formState.errors.comments?.message}>
              <Textarea {...form.register("comments")} />
            </Field>
            <Button type="submit" disabled={addCheckIn.isPending}>
              <MessageSquarePlus />
              {addCheckIn.isPending ? "Saving..." : "Save check-in"}
            </Button>
            {addCheckIn.error ? <p className="text-sm text-destructive">{addCheckIn.error.message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Recent check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quarter</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkIns.data?.map((checkIn) => (
                <TableRow key={checkIn.id}>
                  <TableCell>{checkIn.quarter}</TableCell>
                  <TableCell>{formatPercent(checkIn.progressScore)}</TableCell>
                  <TableCell>{checkIn.plannedValue}</TableCell>
                  <TableCell>{checkIn.actualValue}</TableCell>
                  <TableCell>{formatDate(checkIn.checkInDate)}</TableCell>
                  <TableCell className="max-w-md">{checkIn.comments}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

type CheckInRaw = z.input<typeof checkInSchema>;

const defaultValues: CheckInRaw = {
  goalId: "",
  quarter: "Q1",
  comments: "",
  plannedValue: 0,
  actualValue: 0,
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
