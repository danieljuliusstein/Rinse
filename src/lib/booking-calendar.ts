import type { BookingSchedule } from './booking-schedule'
import { DEFAULT_BOOKING_SCHEDULE } from './booking-schedule'

export { DEFAULT_BOOKING_SCHEDULE } from './booking-schedule'

export function weekdayFromIsoDate(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDay()
}

export function monthDateRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const last = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { from, to }
}

export function datesInMonth(year: number, month: number): string[] {
  const last = new Date(year, month + 1, 0).getDate()
  const dates: string[] = []
  for (let d = 1; d <= last; d++) {
    dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return dates
}

/**
 * Full 6×7 Home calendar grid (includes leading/trailing days from adjacent months).
 * Desk month view paints schedule-closed across this same padded range.
 */
export function datesInMonthGrid(year: number, month: number): string[] {
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(firstOfMonth)
  start.setDate(start.getDate() - firstOfMonth.getDay())
  const dates: string[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${day}`)
  }
  return dates
}

/** Schedule-closed only (closed weekdays − open_dates). Same as Desk. */
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

/**
 * Home / calendar blocked set = closed weekdays ∪ all-day time_blocks.
 * Partial (timed) blocks do not grey the whole day.
 */
export function computeBlockedDates(
  dates: string[],
  schedule: BookingSchedule,
  allDayBlocks: string[]
): Set<string> {
  const blocked = computeScheduleClosedDates(dates, schedule)
  // All-day time off always blocks until the operator removes it.
  for (const date of allDayBlocks) blocked.add(date.slice(0, 10))
  return blocked
}
