"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GoalCard } from "@/components/features/goals/goal-card";
import { trpc } from "@/components/providers/trpc-provider";

type RejectingGoal = { id: string; title: string };

export function ApprovalBoard() {
  const utils = trpc.useUtils();
  const goals = trpc.goals.team.useQuery();
  const decide = trpc.goals.decide.useMutation({
    onSuccess: async (goal) => {
      toast.success(goal.status === "APPROVED" ? "Goal approved" : "Goal rejected — employee notified");
      await Promise.all([
        utils.goals.team.invalidate(),
        utils.goals.list.invalidate(),
        utils.analytics.summary.invalidate(),
        utils.notifications.list.invalidate(),
      ]);
      setRejectingGoal(null);
      setRejectionComment("");
    },
    onError: (error) => toast.error(error.message),
  });
  const [rejectingGoal, setRejectingGoal] = useState<RejectingGoal | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");
  const submitted = goals.data?.filter((goal) => goal.status === "SUBMITTED") ?? [];

  function confirmReject() {
    if (!rejectingGoal || !rejectionComment.trim()) return;
    decide.mutate({
      goalId: rejectingGoal.id,
      decision: "REJECTED",
      comment: rejectionComment.trim(),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Manager queue</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">Goal approvals</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Review submitted goals and lock approved commitments for the cycle.</p>
      </div>

      {decide.error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{decide.error.message}</p> : null}

      {submitted.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {submitted.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              actions={
                <>
                  <Button type="button" size="sm" onClick={() => decide.mutate({ goalId: goal.id, decision: "APPROVED" })} disabled={decide.isPending}>
                    <Check />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectingGoal({ id: goal.id, title: goal.title })}
                    disabled={decide.isPending}
                  >
                    <X />
                    Reject
                  </Button>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <Card className="glass-panel">
          <CardContent className="p-6 text-muted-foreground">No submitted goals are waiting for review.</CardContent>
        </Card>
      )}

      <Dialog open={rejectingGoal !== null} onOpenChange={(open) => !open && setRejectingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject goal</DialogTitle>
            <DialogDescription>
              Send feedback to the employee explaining what needs to change. The comment will be included in their notification.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Label htmlFor="rejection-comment">Goal</Label>
            <p className="text-sm font-medium text-foreground">{rejectingGoal?.title}</p>
            <Label htmlFor="rejection-comment">Rejection comment</Label>
            <Textarea
              id="rejection-comment"
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              placeholder="e.g. Target is too aggressive — split into two milestones, or sharpen the success metric."
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectingGoal(null)} disabled={decide.isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmReject} disabled={decide.isPending || !rejectionComment.trim()}>
              Send rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
