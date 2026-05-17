import { Badge } from "@/components/ui/badge";
import type { GoalStatus } from "@/types/domain";

export function StatusBadge({ status }: { status: GoalStatus }) {
  const variant =
    status === "APPROVED" || status === "LOCKED"
      ? "success"
      : status === "REJECTED"
        ? "destructive"
        : status === "SUBMITTED"
          ? "warning"
          : "secondary";

  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}
