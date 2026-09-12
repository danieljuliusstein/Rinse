/** Blocked-date helpers — same contract as mobile `booking-calendar.ts`. */
import type { BookingSchedule } from './booking-schedule'

export function weekdayFromIsoDate(iso: string): number {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).getDay()
}

/** Inclusive YYYY-MM-DD range (local noon anchoring). */
export function datesInInclusiveRange(fromISO: string, toISO: string): string[] {
  const from = fromISO.slice(0, 10)
  const to = toISO.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return []
  const dates: string[] = []
  const cur = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime()) || cur > end) return []
  while (cur <= end) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

/**
 * Home / calendar blocked set = closed weekdays ∪ all-day time_blocks.
 * Partial (timed) blocks do not grey the whole day.
 */
export function computeBlockedDates(
  dates: string[],
  schedule: BookingSchedule,
  allDayBlocks: string[],
): Set<string> {
  const open = new Set(schedule.open_dates ?? [])
  const blocked = new Set<string>()
  for (const date of dates) {
    const closedWeekday = !schedule.work_days.includes(weekdayFromIsoDate(date))
    if (closedWeekday && !open.has(date)) blocked.add(date)
  }
  for (const date of allDayBlocks) blocked.add(date.slice(0, 10))
  return blocked
}

/** Schedule-closed only (not all-day time-off rows). */
export function computeScheduleClosedDates(
  dates: string[],
  schedule: BookingSchedule,
): Set<string> {
  const open = new Set(schedule.open_dates ?? [])
  const closed = new Set<string>()
  for (const date of dates) {
    const closedWeekday = !schedule.work_days.includes(weekdayFromIsoDate(date))
    if (closedWeekday && !open.has(date)) closed.add(date)
  }
  return closed
}
