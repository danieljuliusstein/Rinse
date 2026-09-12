import type { BusinessExpense, OverheadExpense } from '@rinse/core'

const MS_PER_DAY = 86_400_000

export function daysInclusive(start: Date, end: Date): number {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.max(0, Math.floor((b - a) / MS_PER_DAY) + 1)
}

/** Sum one-off business expenses whose `date` falls in [start, end] (inclusive, local calendar). */
export function sumBusinessExpensesInRange(
  expenses: BusinessExpense[],
  start: Date,
  end: Date,
): number {
  let total = 0
  for (const e of expenses) {
    const d = new Date(`${e.date.slice(0, 10)}T12:00:00`)
    if (d >= start && d <= end) total += Number(e.amount) || 0
  }
  return roundCents(total)
}

/**
 * Prorate recurring overhead into a date range by calendar-month overlap.
 * - monthly: amount × Σ(overlapDays / daysInMonth)
 * - annual: (amount / 12) × same fraction
 * - one_time: full amount when `next_due` falls in range
 */
export function overheadForDateRange(
  items: OverheadExpense[],
  start: Date,
  end: Date,
): number {
  const monthsFraction = calendarMonthsFraction(start, end)
  let total = 0

  for (const e of items) {
    const amount = Number(e.amount) || 0
    const cycle = e.billing_cycle ?? 'monthly'

    if (cycle === 'one_time') {
      if (!e.next_due) continue
      const due = new Date(`${e.next_due.slice(0, 10)}T12:00:00`)
      if (due >= start && due <= end) total += amount
      continue
    }

    const monthly = cycle === 'annual' ? amount / 12 : amount
    total += monthly * monthsFraction
  }

  return roundCents(total)
}

/** Sum of (overlap days / days in that month) across every month touching [start, end]. */
export function calendarMonthsFraction(start: Date, end: Date): number {
  if (end < start) return 0

  let fraction = 0
  let y = start.getFullYear()
  let m = start.getMonth()

  for (;;) {
    const monthStart = new Date(y, m, 1)
    const monthEnd = new Date(y, m + 1, 0, 23, 59, 59)
    const daysInMonth = monthEnd.getDate()
    const overlapStart = start > monthStart ? start : monthStart
    const overlapEnd = end < monthEnd ? end : monthEnd
    if (overlapStart <= overlapEnd) {
      fraction += daysInclusive(overlapStart, overlapEnd) / daysInMonth
    }
    if (y > end.getFullYear() || (y === end.getFullYear() && m >= end.getMonth())) break
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }

  return fraction
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100
}
