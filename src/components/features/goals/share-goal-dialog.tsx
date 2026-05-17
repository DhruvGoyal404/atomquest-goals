"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Share2, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/components/providers/trpc-provider";
import { initials } from "@/lib/utils/format";
import type { GoalWithOwner } from "@/types/domain";

interface ShareGoalDialogProps {
  goal: GoalWithOwner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShared?: () => void;
}

export function ShareGoalDialog({ goal, open, onOpenChange, onShared }: ShareGoalDialogProps) {
  const utils = trpc.useUtils();
  const peers = trpc.goals.peers.useQuery(undefined, { enabled: open });
  const shareMutation = trpc.goals.share.useMutation({
    onSuccess: async () => {
      toast.success("Goal shared with selected teammates");
      await utils.goals.mine.invalidate();
      onOpenChange(false);
      onShared?.();
    },
    onError: (error) => toast.error(error.message),
  });

  const [selected, setSelected] = useState<Set<string>>(new Set(goal.sharedWith));

  function toggle(peerId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(peerId)) next.delete(peerId);
      else next.add(peerId);
      return next;
    });
  }

  function save() {
    shareMutation.mutate({ goalId: goal.id, sharedWith: [...selected] });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Share goal
          </DialogTitle>
          <DialogDescription>Select teammates to share &quot;{goal.title}&quot; with. They will be notified and see this goal in their workspace.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {peers.isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading teammates...</p>
          ) : peers.data?.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No teammates found to share with.</p>
          ) : (
            peers.data?.map((peer) => {
              const isSelected = selected.has(peer.id);
              return (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => toggle(peer.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted ${
                    isSelected ? "border-primary bg-primary/5" : "bg-background/70"
                  }`}
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">{initials(peer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{peer.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{peer.designation ?? peer.department}</p>
                  </div>
                  {isSelected && <UserCheck className="size-5 shrink-0 text-primary" />}
                </button>
              );
            })
          )}

          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1 rounded-md border bg-muted/40 p-2">
              {[...selected].map((id) => {
                const peer = peers.data?.find((p) => p.id === id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {peer?.name ?? id}
                    <button type="button" onClick={() => toggle(id)} aria-label="Remove">
                      <X className="size-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          {shareMutation.error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {shareMutation.error.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={shareMutation.isPending}>
              <Share2 />
              {shareMutation.isPending ? "Saving..." : selected.size === 0 ? "Unshare" : "Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
