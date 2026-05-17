"use client";

import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/components/providers/trpc-provider";
import { formatDate } from "@/lib/utils/format";
import type { Escalation } from "@/types/domain";

const typeLabel: Record<Escalation["type"], string> = {
  GOAL_NOT_SUBMITTED: "Goals not submitted",
  GOAL_NOT_APPROVED: "Goals not approved",
  CHECKIN_OVERDUE: "Check-in overdue",
};

const typeTone: Record<Escalation["type"], "destructive" | "warning" | "secondary"> = {
  GOAL_NOT_SUBMITTED: "destructive",
  GOAL_NOT_APPROVED: "warning",
  CHECKIN_OVERDUE: "secondary",
};

export function EscalationPanel() {
  const utils = trpc.useUtils();
  const escalations = trpc.escalations.list.useQuery();
  const autoDetect = trpc.escalations.autoDetect.useMutation({
    onSuccess: () => {
      toast.success("Auto-detect complete — escalation list refreshed");
      void utils.escalations.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const resolve = trpc.escalations.resolve.useMutation({
    onSuccess: () => {
      toast.success("Escalation resolved");
      void utils.escalations.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const open = escalations.data?.filter((e) => !e.resolved) ?? [];
  const resolved = escalations.data?.filter((e) => e.resolved) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Compliance & risk</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">Escalations</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Track unresolved goal workflow issues and push automated escalations for overdue items.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => autoDetect.mutate()}
          disabled={autoDetect.isPending}
          variant="outline"
        >
          <RefreshCw className={autoDetect.isPending ? "animate-spin" : ""} />
          Auto-detect
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-md bg-destructive/10">
              <ShieldAlert className="size-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{open.length}</p>
              <p className="text-sm text-muted-foreground">Open escalations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-md bg-warning/10">
              <AlertTriangle className="size-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {open.filter((e) => e.escalationLevel >= 2).length}
              </p>
              <p className="text-sm text-muted-foreground">Escalated to HR</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-md bg-success/10">
              <CheckCircle2 className="size-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{resolved.length}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Open escalations</CardTitle>
        </CardHeader>
        <CardContent>
          {open.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <CheckCircle2 className="size-10 text-success" />
              <p className="font-medium">All clear — no open escalations</p>
              <p className="text-sm">Click &quot;Auto-detect&quot; to scan for overdue items.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Due by</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {open.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.employeeName ?? e.employeeId}</TableCell>
                    <TableCell>
                      <Badge variant={typeTone[e.type]}>{typeLabel[e.type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {e.escalationLevel}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(e.dueDate)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={resolve.isPending}
                        onClick={() => resolve.mutate({ escalationId: e.id })}
                      >
                        Resolve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {resolved.length > 0 && (
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Resolved at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolved.slice(0, 10).map((e) => (
                  <TableRow key={e.id} className="text-muted-foreground">
                    <TableCell>{e.employeeName ?? e.employeeId}</TableCell>
                    <TableCell>{typeLabel[e.type]}</TableCell>
                    <TableCell>{formatDate(e.resolvedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
