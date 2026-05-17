"use client";

import { CircleAlert, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/features/analytics/metric-card";
import { StatusBadge } from "@/components/features/goals/status-badge";
import { trpc } from "@/components/providers/trpc-provider";
import { formatPercent } from "@/lib/utils/format";

export function TeamDashboard() {
  const goals = trpc.goals.team.useQuery();
  const summary = trpc.analytics.summary.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Team operating view</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">Direct reports</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Track alignment, risk, and approval status across team goals.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Visible goals" value={summary.data?.totalGoals ?? 0} icon={Target} />
        <MetricCard title="Approved" value={summary.data?.approvedGoals ?? 0} icon={ShieldCheck} tone="success" />
        <MetricCard title="At risk" value={summary.data?.atRiskGoals ?? 0} icon={CircleAlert} tone="warning" />
        <MetricCard title="Progress" value={formatPercent(summary.data?.averageProgress ?? 0)} icon={TrendingUp} tone="accent" />
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Goal register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Weightage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.data?.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{goal.employee.name}</p>
                      <p className="text-xs text-muted-foreground">{goal.employee.department}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">{goal.thrustArea}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={goal.status} />
                  </TableCell>
                  <TableCell className="min-w-44">
                    <div className="space-y-1">
                      <span className="text-sm">{formatPercent(goal.currentProgress)}</span>
                      <Progress value={goal.currentProgress} />
                    </div>
                  </TableCell>
                  <TableCell>{goal.weightage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
