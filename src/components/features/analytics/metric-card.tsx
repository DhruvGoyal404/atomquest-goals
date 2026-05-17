import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function MetricCard({
  title,
  value,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "accent";
}) {
  return (
    <Card className="glass-panel">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-md",
            tone === "primary" && "bg-primary/12 text-primary",
            tone === "success" && "bg-success/12 text-success",
            tone === "warning" && "bg-warning/12 text-amber-700 dark:text-warning",
            tone === "accent" && "bg-accent/12 text-accent",
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
