"use client";

import { Award, Bell, CircleAlert, Flame, Target, TrendingDown, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/features/analytics/metric-card";
import { trpc } from "@/components/providers/trpc-provider";
import { formatDate, formatPercent } from "@/lib/utils/format";

export function AnalyticsDashboard() {
  const summary = trpc.analytics.summary.useQuery();
  const team = trpc.analytics.team.useQuery();
  const leaderboard = trpc.analytics.leaderboard.useQuery();
  const audit = trpc.analytics.audit.useQuery();
  const predictions = trpc.analytics.predictions.useQuery();

  // Use the first prediction's monthly data for the trajectory chart, or empty array
  const trajectoryData = predictions.data?.[0]?.monthlyData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Performance intelligence</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">Analytics</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Progress signals, risk heatmaps, completion trajectory, and audit-ready activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Goals" value={summary.data?.totalGoals ?? 0} icon={Target} />
        <MetricCard title="Average progress" value={formatPercent(summary.data?.averageProgress ?? 0)} icon={TrendingUp} tone="accent" />
        <MetricCard title="At risk" value={summary.data?.atRiskGoals ?? 0} icon={CircleAlert} tone="warning" />
        <MetricCard title="Unread alerts" value={summary.data?.unreadNotifications ?? 0} icon={Bell} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Department progress</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={team.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageProgress" name="Progress" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="approvedRate" name="Approved rate" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Risk heatmap</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(team.data ?? []).map((item) => (
              <div key={item.department} className="grid grid-cols-[1fr_80px] items-center gap-3">
                <span className="truncate text-sm font-medium">{item.department}</span>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((index) => {
                    const score = item.averageProgress - index * 8;
                    return (
                      <span
                        key={index}
                        className="h-8 rounded-sm border"
                        style={{
                          backgroundColor:
                            score >= 80
                              ? "hsl(var(--success) / 0.75)"
                              : score >= 60
                                ? "hsl(var(--warning) / 0.7)"
                                : "hsl(var(--destructive) / 0.65)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>Predictive trajectory</CardTitle>
              {predictions.data?.[0] && (
                <Badge variant={predictions.data[0].onTrackToComplete ? "success" : "destructive"}>
                  {predictions.data[0].onTrackToComplete ? (
                    <><TrendingUp className="mr-1 size-3" /> On track</>
                  ) : (
                    <><TrendingDown className="mr-1 size-3" /> At risk</>
                  )}
                </Badge>
              )}
            </div>
            {predictions.data?.[0] && (
              <p className="text-sm text-muted-foreground">
                {predictions.data[0].title} — projected {formatPercent(predictions.data[0].predictedProgress)} by year-end
              </p>
            )}
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip formatter={(v) => v != null ? `${v}%` : "—"} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
                <Line type="monotone" dataKey="projected" name="Projected" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.data?.map((entry, index) => (
                <div key={entry.employeeId} className="flex items-center justify-between rounded-lg border bg-background/70 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">{index + 1}</div>
                    <div>
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-sm text-muted-foreground">{entry.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={entry.badge === "Gold" || entry.badge === "Platinum" ? "success" : "secondary"}>
                      <Award className="mr-1 size-3" />
                      {entry.badge}
                    </Badge>
                    <p className="mt-1 flex items-center justify-end gap-1 text-sm text-muted-foreground">
                      {formatPercent(entry.progress)}
                      {entry.streakCount > 0 && (
                        <span className="ml-1 flex items-center gap-0.5 text-warning">
                          <Flame className="size-3" />{entry.streakCount}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {(predictions.data?.length ?? 0) > 0 && (
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Goal-level predictions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {predictions.data?.map((p) => (
              <div key={p.goalId} className="rounded-lg border bg-background/70 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 font-medium">{p.title}</p>
                  <Badge variant={p.onTrackToComplete ? "success" : "destructive"} className="shrink-0">
                    {p.onTrackToComplete ? "On track" : "At risk"}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="font-semibold">{formatPercent(p.currentProgress)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Predicted</p>
                    <p className="font-semibold">{formatPercent(p.predictedProgress)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Audit trail</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Old</TableHead>
                <TableHead>New</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.data?.slice(0, 8).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.field ?? "Goal"}</TableCell>
                  <TableCell className="max-w-40 truncate">{log.oldValue ?? ""}</TableCell>
                  <TableCell className="max-w-40 truncate">{log.newValue ?? ""}</TableCell>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
