"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, UsersRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/components/providers/trpc-provider";
import { cycleSchema } from "@/lib/validations/goal.validation";
import { formatDate } from "@/lib/utils/format";

type CycleInput = z.infer<typeof cycleSchema>;
type CycleRaw = z.input<typeof cycleSchema>;

export function AdminPanel() {
  const utils = trpc.useUtils();
  const cycles = trpc.admin.cycles.useQuery();
  const users = trpc.admin.users.useQuery();
  const createCycle = trpc.admin.createCycle.useMutation({
    onSuccess: async () => {
      await utils.admin.cycles.invalidate();
      form.reset(defaultValues);
    },
  });
  const form = useForm<CycleRaw, unknown, CycleInput>({
    resolver: zodResolver(cycleSchema),
    defaultValues,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Administration</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">Cycle and user management</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Configure goal cycles and inspect synchronized organization records.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Create cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit((values) => createCycle.mutate(values))}>
              <Field label="Name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Start date" error={form.formState.errors.startDate?.message}>
                  <Input type="date" {...form.register("startDate", { valueAsDate: true })} />
                </Field>
                <Field label="End date" error={form.formState.errors.endDate?.message}>
                  <Input type="date" {...form.register("endDate", { valueAsDate: true })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" {...form.register("isActive")} />
                Set active
              </label>
              <Button type="submit" disabled={createCycle.isPending}>
                <CalendarPlus />
                {createCycle.isPending ? "Creating..." : "Create cycle"}
              </Button>
              {createCycle.error ? <p className="text-sm text-destructive">{createCycle.error.message}</p> : null}
            </form>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Goal cycles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.data?.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">{cycle.name}</TableCell>
                    <TableCell>{formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}</TableCell>
                    <TableCell>{cycle.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Directory</CardTitle>
          <UsersRound className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{users.data.find((candidate) => candidate.id === user.managerId)?.name ?? "None"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const defaultValues: CycleRaw = {
  name: "FY 2027-28",
  startDate: new Date("2027-04-01T00:00:00.000Z"),
  endDate: new Date("2028-03-31T00:00:00.000Z"),
  isActive: false,
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
