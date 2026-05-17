"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Download, FileSpreadsheet, FileText, Scale, Share2, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalCard } from "@/components/features/goals/goal-card";
import { GoalForm } from "@/components/features/goals/goal-form";
import { ShareGoalDialog } from "@/components/features/goals/share-goal-dialog";
import { MetricCard } from "@/components/features/analytics/metric-card";
import { trpc } from "@/components/providers/trpc-provider";
import { downloadCsv, downloadExcel, downloadPdfFromElement } from "@/lib/utils/exporters";
import { formatPercent } from "@/lib/utils/format";
import type { GoalWithOwner } from "@/types/domain";

export function GoalsWorkspace() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [sharingGoal, setSharingGoal] = useState<GoalWithOwner | null>(null);
  const utils = trpc.useUtils();
  const goals = trpc.goals.mine.useQuery();
  const summary = trpc.analytics.summary.useQuery();
  const exportRows = trpc.goals.exportRows.useQuery(undefined, { enabled: false });
  const submit = trpc.goals.submit.useMutation({
    onSuccess: async () => {
      toast.success("Goals submitted for approval");
      await Promise.all([
        utils.goals.mine.invalidate(),
        utils.goals.list.invalidate(),
        utils.analytics.summary.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  async function exportAsCsv() {
    try {
      const rows = (await exportRows.refetch()).data ?? [];
      downloadCsv("atomquest-goals.csv", rows);
      toast.success("CSV downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "CSV export failed");
    }
  }

  async function exportAsExcel() {
    try {
      const rows = (await exportRows.refetch()).data ?? [];
      await downloadExcel("atomquest-goals.xlsx", rows);
      toast.success("Excel file downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Excel export failed");
    }
  }

  async function exportAsPdf() {
    if (!reportRef.current) return;
    try {
      await downloadPdfFromElement("atomquest-goals.pdf", reportRef.current);
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF export failed (oklab colors not supported — switch to light theme and retry)");
    }
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Employee workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">Goal sheet</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">FY 2026-27 goal planning, progress, achievements, and exports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportAsCsv}>
            <Download />
            CSV
          </Button>
          <Button type="button" variant="outline" onClick={exportAsExcel}>
            <FileSpreadsheet />
            Excel
          </Button>
          <Button type="button" variant="outline" onClick={exportAsPdf}>
            <FileText />
            PDF
          </Button>
          <Button type="button" onClick={() => submit.mutate({})} disabled={submit.isPending}>
            <ShieldCheck />
            Submit
          </Button>
        </div>
      </div>

      {submit.error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{submit.error.message}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total goals" value={summary.data?.totalGoals ?? 0} icon={Target} />
        <MetricCard title="Approved" value={summary.data?.approvedGoals ?? 0} icon={ShieldCheck} tone="success" />
        <MetricCard title="Progress" value={formatPercent(summary.data?.averageProgress ?? 0)} icon={TrendingUp} tone="accent" />
        <MetricCard title="Weightage" value={`${summary.data?.totalWeightage ?? 0}%`} icon={Scale} tone="warning" />
      </div>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        <TabsContent value="goals">
          {goals.isLoading ? (
            <Card className="glass-panel">
              <CardContent className="p-6 text-muted-foreground">Loading goals...</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {goals.data?.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  actions={
                    !goal.isLocked && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSharingGoal(goal)}
                      >
                        <Share2 />
                        {goal.isShared ? "Manage sharing" : "Share"}
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="create">
          <GoalForm />
        </TabsContent>
        <TabsContent value="achievements">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Quarterly achievements</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {goals.data?.flatMap((goal) =>
                goal.achievements.map((achievement) => (
                  <div key={`${goal.id}-${achievement.quarter}`} className="rounded-lg border bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{goal.title}</p>
                        <p className="text-sm text-muted-foreground">{achievement.quarter}</p>
                      </div>
                      <span className="rounded-md border px-2 py-1 text-xs font-medium">{achievement.status.replaceAll("_", " ")}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <span className="text-muted-foreground">Planned {achievement.planned}</span>
                      <span className="text-muted-foreground">Actual {achievement.actual}</span>
                    </div>
                  </div>
                )),
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {sharingGoal && (
        <ShareGoalDialog
          goal={sharingGoal}
          open={!!sharingGoal}
          onOpenChange={(open) => { if (!open) setSharingGoal(null); }}
        />
      )}
    </div>
  );
}
