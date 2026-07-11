export interface BookingSchedule {
  work_days: number[]
  start_time: string
  end_time: string
  lunch_start?: string
  lunch_end?: string
  slot_interval_minutes: number
}

export const DEFAULT_BOOKING_SCHEDULE: BookingSchedule = {
  work_days: [1, 2, 3, 4, 5, 6],
  start_time: '08:00',
  end_time: '18:00',
  lunch_start: '12:00',
  lunch_end: '13:00',
  slot_interval_minutes: 120,
}

export const SLOT_INTERVALS = [60, 90, 120] as const

export function normalizeBookingSchedule(raw: unknown): BookingSchedule {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return normalizeBookingSchedule(JSON.parse(raw))
    } catch {
      return { ...DEFAULT_BOOKING_SCHEDULE }
    }
  }
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_BOOKING_SCHEDULE }
  const o = raw as Record<string, unknown>
  const workDays = Array.isArray(o.work_days)
    ? o.work_days
        .map((d) => {
          const n = typeof d === 'number' ? d : typeof d === 'string' ? Number(d) : NaN
          return Number.isInteger(n) && n >= 0 && n <= 6 ? n : null
        })
        .filter((d): d is number => d !== null)
    : DEFAULT_BOOKING_SCHEDULE.work_days
  const intervalRaw = o.slot_interval_minutes
  const parsedInterval =
    typeof intervalRaw === 'number'
      ? intervalRaw
      : typeof intervalRaw === 'string'
        ? Number(intervalRaw)
        : NaN
  const interval =
    parsedInterval > 0 ? parsedInterval : DEFAULT_BOOKING_SCHEDULE.slot_interval_minutes
  return {
    work_days: workDays.length > 0 ? workDays : [...DEFAULT_BOOKING_SCHEDULE.work_days],
    start_time:
      typeof o.start_time === 'string' && o.start_time ? o.start_time : DEFAULT_BOOKING_SCHEDULE.start_time,
    end_time: typeof o.end_time === 'string' && o.end_time ? o.end_time : DEFAULT_BOOKING_SCHEDULE.end_time,
    lunch_start: typeof o.lunch_start === 'string' ? o.lunch_start : DEFAULT_BOOKING_SCHEDULE.lunch_start,
    lunch_end: typeof o.lunch_end === 'string' ? o.lunch_end : DEFAULT_BOOKING_SCHEDULE.lunch_end,
    slot_interval_minutes: interval,
  }
}

export function lunchBreakEnabled(schedule: BookingSchedule): boolean {
  return Boolean(schedule.lunch_start?.trim() && schedule.lunch_end?.trim())
}
