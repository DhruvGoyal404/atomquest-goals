import { format } from "date-fns";

export function formatDate(value?: string | Date | null): string {
  if (!value) {
    return "Not set";
  }

  return format(new Date(value), "MMM d, yyyy");
}

export function formatPercent(value: number): string {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
