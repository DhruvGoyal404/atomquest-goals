import type { AchievementStatus, UoMType } from "@/types/domain";

export function calculateProgress(
  uomType: UoMType,
  target: number,
  actual: number,
  targetDate?: Date | null,
  completionDate?: Date | null,
): number {
  if (!Number.isFinite(target) || !Number.isFinite(actual)) {
    return 0;
  }

  if ((uomType === "MIN_NUMERIC" || uomType === "MIN_PERCENTAGE") && target <= 0) {
    return 0;
  }

  switch (uomType) {
    case "MIN_NUMERIC":
    case "MIN_PERCENTAGE":
      return clampPercent((actual / target) * 100);

    case "MAX_NUMERIC":
    case "MAX_PERCENTAGE":
      if (actual <= 0) {
        return target >= 0 ? 100 : 0;
      }
      return clampPercent((target / actual) * 100);

    case "TIMELINE": {
      if (!targetDate || !completionDate) {
        return 0;
      }

      const daysDifference = Math.floor(
        (targetDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      return daysDifference >= 0 ? 100 : clampPercent(100 + daysDifference * 2);
    }

    case "ZERO":
      return actual === 0 ? 100 : 0;

    default:
      return 0;
  }
}

export function deriveAchievementStatus(progress: number): AchievementStatus {
  if (progress >= 100) {
    return "COMPLETED";
  }

  if (progress >= 70) {
    return "ON_TRACK";
  }

  if (progress > 0) {
    return "AT_RISK";
  }

  return "NOT_STARTED";
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Number(value.toFixed(1))));
}
