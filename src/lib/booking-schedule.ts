/** Booking / work hours — same shape as mobile `booking-schedule.ts` (app_settings.booking_schedule). */

export interface BookingSchedule {
  work_days: number[]
  start_time: string
  end_time: string
  lunch_start?: string
  lunch_end?: string
  /** How often arrival windows are offered (window starts). */
  slot_interval_minutes: number
  /** Length of each arrival window shown to customers. */
  arrival_window_minutes: number
  /** Minutes blocked after each job before the next can start. */
  buffer_minutes: number
  /**
   * Extra pad for travel between jobs (static ETA / route pad).
   * Added to buffer_minutes when computing availability.
   */
  drive_time_pad_minutes: number
  /** Optional hard cap on scheduled jobs per day (0 = unlimited). */
  max_jobs_per_day: number
  /** Specific YYYY-MM-DD dates open even when weekday is off the schedule. */
  open_dates: string[]
}

export const DEFAULT_BOOKING_SCHEDULE: BookingSchedule = {
  work_days: [1, 2, 3, 4, 5, 6],
  start_time: '08:00',
  end_time: '18:00',
  lunch_start: '12:00',
  lunch_end: '13:00',
  slot_interval_minutes: 120,
  arrival_window_minutes: 120,
  buffer_minutes: 30,
  drive_time_pad_minutes: 0,
  max_jobs_per_day: 0,
  open_dates: [],
}

export const SLOT_INTERVALS = [60, 90, 120] as const
export const ARRIVAL_WINDOW_OPTIONS = [60, 90, 120, 180] as const
export const BUFFER_OPTIONS = [0, 15, 30, 45, 60] as const
export const DRIVE_TIME_PAD_OPTIONS = [0, 15, 30, 45, 60, 90] as const

/** Sunday = 0 … Saturday = 6 (JS Date.getDay). */
export const WEEKDAY_LABELS: { day: number; short: string; label: string }[] = [
  { day: 0, short: 'Sun', label: 'Sunday' },
  { day: 1, short: 'Mon', label: 'Monday' },
  { day: 2, short: 'Tue', label: 'Tuesday' },
  { day: 3, short: 'Wed', label: 'Wednesday' },
  { day: 4, short: 'Thu', label: 'Thursday' },
  { day: 5, short: 'Fri', label: 'Friday' },
  { day: 6, short: 'Sat', label: 'Saturday' },
]

function parsePositiveInt(raw: unknown, fallback: number): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.floor(n)
}

export function normalizeBookingSchedule(raw: unknown): BookingSchedule {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return normalizeBookingSchedule(JSON.parse(raw))
    } catch {
      return { ...DEFAULT_BOOKING_SCHEDULE, open_dates: [] }
    }
  }
  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULT_BOOKING_SCHEDULE, open_dates: [] }
  }
  const o = raw as Record<string, unknown>
  const workDays = Array.isArray(o.work_days)
    ? o.work_days
        .map((d) => {
          const n = typeof d === 'number' ? d : typeof d === 'string' ? Number(d) : NaN
          return Number.isInteger(n) && n >= 0 && n <= 6 ? n : null
        })
        .filter((d): d is number => d !== null)
    : DEFAULT_BOOKING_SCHEDULE.work_days
  const interval = parsePositiveInt(
    o.slot_interval_minutes,
    DEFAULT_BOOKING_SCHEDULE.slot_interval_minutes,
  )
  const arrivalWindow = parsePositiveInt(
    o.arrival_window_minutes,
    interval > 0 ? interval : DEFAULT_BOOKING_SCHEDULE.arrival_window_minutes,
  )
  const openDates = Array.isArray(o.open_dates)
    ? o.open_dates
        .map((d) => (typeof d === 'string' ? d.slice(0, 10) : ''))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    : []
  return {
    work_days: workDays.length > 0 ? workDays : [...DEFAULT_BOOKING_SCHEDULE.work_days],
    start_time:
      typeof o.start_time === 'string' && o.start_time
        ? o.start_time.slice(0, 5)
        : DEFAULT_BOOKING_SCHEDULE.start_time,
    end_time:
      typeof o.end_time === 'string' && o.end_time
        ? o.end_time.slice(0, 5)
        : DEFAULT_BOOKING_SCHEDULE.end_time,
    lunch_start:
      typeof o.lunch_start === 'string' ? o.lunch_start.slice(0, 5) : DEFAULT_BOOKING_SCHEDULE.lunch_start,
    lunch_end:
      typeof o.lunch_end === 'string' ? o.lunch_end.slice(0, 5) : DEFAULT_BOOKING_SCHEDULE.lunch_end,
    slot_interval_minutes: interval > 0 ? interval : DEFAULT_BOOKING_SCHEDULE.slot_interval_minutes,
    arrival_window_minutes:
      arrivalWindow > 0 ? arrivalWindow : DEFAULT_BOOKING_SCHEDULE.arrival_window_minutes,
    buffer_minutes: parsePositiveInt(o.buffer_minutes, DEFAULT_BOOKING_SCHEDULE.buffer_minutes),
    drive_time_pad_minutes: parsePositiveInt(
      o.drive_time_pad_minutes,
      DEFAULT_BOOKING_SCHEDULE.drive_time_pad_minutes,
    ),
    max_jobs_per_day: parsePositiveInt(o.max_jobs_per_day, DEFAULT_BOOKING_SCHEDULE.max_jobs_per_day),
    open_dates: [...new Set(openDates)].sort(),
  }
}

export function lunchBreakEnabled(schedule: BookingSchedule): boolean {
  return Boolean(schedule.lunch_start?.trim() && schedule.lunch_end?.trim())
}
