/** Quiet-hours / timezone helpers — mirrors `@rinse/core` quiet-hours picker list. */

export const DEFAULT_QUIET_START_HOUR = 21
export const DEFAULT_QUIET_END_HOUR = 8
export const DEFAULT_QUIET_TIME_ZONE = 'America/New_York'

/** Common US / North America zones for settings pickers. */
export const COMMON_TIME_ZONES: { value: string; label: string }[] = [
  { value: 'America/New_York', label: 'Eastern' },
  { value: 'America/Chicago', label: 'Central' },
  { value: 'America/Denver', label: 'Mountain' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'America/Los_Angeles', label: 'Pacific' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'America/Toronto', label: 'Toronto' },
  { value: 'America/Vancouver', label: 'Vancouver' },
  { value: 'UTC', label: 'UTC' },
]

export function normalizeTimeZone(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return DEFAULT_QUIET_TIME_ZONE
  return raw.trim()
}

export function detectDeviceTimeZone(): string {
  try {
    return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return DEFAULT_QUIET_TIME_ZONE
  }
}

export function clampHour(raw: unknown, fallback: number): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  if (!Number.isFinite(n)) return fallback
  return Math.min(23, Math.max(0, Math.floor(n)))
}
