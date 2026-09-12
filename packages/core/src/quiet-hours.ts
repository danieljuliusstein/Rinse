/** Default quiet hours: 9pm–8am in the org timezone (Wave 3B). */
export const DEFAULT_QUIET_START_HOUR = 21
export const DEFAULT_QUIET_END_HOUR = 8
export const DEFAULT_QUIET_TIME_ZONE = 'America/New_York'

/** @deprecated Use DEFAULT_QUIET_START_HOUR */
export const DEFAULT_SMS_QUIET_START_HOUR = DEFAULT_QUIET_START_HOUR
/** @deprecated Use DEFAULT_QUIET_END_HOUR */
export const DEFAULT_SMS_QUIET_END_HOUR = DEFAULT_QUIET_END_HOUR

export type QuietHoursConfig = {
  /** When false, never defer. Default true. */
  enabled?: boolean
  /** IANA timezone (e.g. America/Chicago). Default America/New_York. */
  timeZone?: string
  /** Hour when quiet window starts (0–23). Inclusive. Default 21. */
  startHour?: number
  /** Hour when quiet window ends (0–23). Exclusive. Default 8. */
  endHour?: number
}

/** @deprecated Use QuietHoursConfig */
export type SmsQuietHoursConfig = QuietHoursConfig

export function clampHour(h: number): number {
  if (!Number.isFinite(h)) return 0
  return Math.min(23, Math.max(0, Math.floor(h)))
}

export function normalizeTimeZone(timeZone?: string | null): string {
  const raw = timeZone?.trim()
  if (!raw) return DEFAULT_QUIET_TIME_ZONE
  try {
    // Throws RangeError for invalid IANA ids
    Intl.DateTimeFormat(undefined, { timeZone: raw })
    return raw
  } catch {
    return DEFAULT_QUIET_TIME_ZONE
  }
}

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const tz = normalizeTimeZone(timeZone)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const map: Record<string, string> = {}
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  }
}

/** Wall-clock hour (0–23) in the given timezone. */
export function getHourInTimeZone(date: Date, timeZone?: string | null): number {
  return getZonedParts(date, normalizeTimeZone(timeZone)).hour
}

/**
 * Convert a civil date/time in `timeZone` to a UTC Date.
 * Refines twice to handle DST transitions.
 */
export function zonedCivilToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone?: string | null,
): Date {
  const tz = normalizeTimeZone(timeZone)
  const asUtcGuess = Date.UTC(year, month - 1, day, hour, minute, 0)

  const offsetMs = (instant: number) => {
    const parts = getZonedParts(new Date(instant), tz)
    const asIfUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    )
    return asIfUtc - instant
  }

  let utc = asUtcGuess - offsetMs(asUtcGuess)
  utc = asUtcGuess - offsetMs(utc)
  return new Date(utc)
}

function resolveConfig(config: QuietHoursConfig = {}): Required<
  Pick<QuietHoursConfig, 'enabled' | 'timeZone' | 'startHour' | 'endHour'>
> {
  return {
    enabled: config.enabled !== false,
    timeZone: normalizeTimeZone(config.timeZone),
    startHour: clampHour(config.startHour ?? DEFAULT_QUIET_START_HOUR),
    endHour: clampHour(config.endHour ?? DEFAULT_QUIET_END_HOUR),
  }
}

/**
 * True when automated customer messages should be deferred.
 * Overnight windows (e.g. 21→8) are supported. Uses org timezone when set.
 */
export function isWithinQuietHours(
  now: Date = new Date(),
  config: QuietHoursConfig = {},
): boolean {
  const { enabled, timeZone, startHour, endHour } = resolveConfig(config)
  if (!enabled) return false
  if (startHour === endHour) return false

  const hour = getHourInTimeZone(now, timeZone)
  if (startHour > endHour) {
    return hour >= startHour || hour < endHour
  }
  return hour >= startHour && hour < endHour
}

/** @deprecated Use isWithinQuietHours */
export function isWithinSmsQuietHours(
  now: Date = new Date(),
  config: QuietHoursConfig = {},
): boolean {
  return isWithinQuietHours(now, config)
}

/** Next instant when quiet hours end in the org timezone (for queue / UI). */
export function nextQuietHoursEnd(
  now: Date = new Date(),
  config: QuietHoursConfig = {},
): Date {
  const { timeZone, endHour } = resolveConfig(config)
  const parts = getZonedParts(now, timeZone)

  let candidate = zonedCivilToUtc(parts.year, parts.month, parts.day, endHour, 0, timeZone)
  if (candidate.getTime() <= now.getTime()) {
    // Civil +1 day (UTC date math on Y-M-D components).
    const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1))
    candidate = zonedCivilToUtc(
      next.getUTCFullYear(),
      next.getUTCMonth() + 1,
      next.getUTCDate(),
      endHour,
      0,
      timeZone,
    )
  }
  return candidate
}

/** @deprecated Use nextQuietHoursEnd */
export function nextSmsQuietHoursEnd(
  now: Date = new Date(),
  config: QuietHoursConfig = {},
): Date {
  return nextQuietHoursEnd(now, config)
}

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

export function detectDeviceTimeZone(): string {
  try {
    return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return DEFAULT_QUIET_TIME_ZONE
  }
}

export function formatQuietHoursLabel(config: QuietHoursConfig = {}): string {
  const { enabled, timeZone, startHour, endHour } = resolveConfig(config)
  if (!enabled) return 'Off'
  const fmt = (h: number) => {
    const d = new Date()
    d.setHours(h, 0, 0, 0)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  const zone =
    COMMON_TIME_ZONES.find((z) => z.value === timeZone)?.label ?? timeZone.replace(/_/g, ' ')
  return `${fmt(startHour)}–${fmt(endHour)} · ${zone}`
}
