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

export function computeBlockedDates(
  dates: string[],
  schedule: BookingSchedule,
  allDayBlocks: string[]
): Set<string> {
  const blocked = new Set<string>()
  for (const date of dates) {
    if (!schedule.work_days.includes(weekdayFromIsoDate(date))) blocked.add(date)
  }
  for (const date of allDayBlocks) blocked.add(date)
  return blocked
}
