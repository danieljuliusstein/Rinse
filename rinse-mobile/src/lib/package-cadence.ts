export const DEFAULT_RETURN_DAYS = 90

export function normalizeReturnDays(days: number | undefined | null): number {
  if (days == null || !Number.isFinite(days) || days < 7) return DEFAULT_RETURN_DAYS
  return Math.round(days)
}
