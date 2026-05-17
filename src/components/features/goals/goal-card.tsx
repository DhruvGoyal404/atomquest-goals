"use client";

import { motion } from "framer-motion";
import { CalendarClock, Lock, Share2, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/features/goals/status-badge";
import { formatDate, formatPercent } from "@/lib/utils/format";
import type { GoalWithOwner } from "@/types/domain";

export function GoalCard({ goal, actions }: { goal: GoalWithOwner; actions?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <Card className="glass-panel h-full">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={goal.status} />
                {goal.isLocked ? <Lock className="size-4 text-muted-foreground" aria-label="Locked" /> : null}
                {goal.isShared ? <Share2 className="size-4 text-muted-foreground" aria-label="Shared" /> : null}
              </div>
              <h3 className="text-base font-semibold leading-6">{goal.title}</h3>
              <p className="text-sm text-muted-foreground">{goal.thrustArea}</p>
            </div>
            <div className="rounded-md border bg-background/70 px-2 py-1 text-xs font-semibold">{goal.weightage}%</div>
          </div>

          {goal.description ? <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{goal.description}</p> : null}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{formatPercent(goal.currentProgress)}</span>
            </div>
            <Progress value={goal.currentProgress} />
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="size-4" />
              Target {goal.target}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4" />
              {formatDate(goal.targetDate)}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
            <span>{goal.employee.name}</span>
            <span>{goal.uomType.replaceAll("_", " ")}</span>
          </div>
          {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
