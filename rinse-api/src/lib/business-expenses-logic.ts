import type { BusinessExpense } from './types'

function parseDateOnly(iso: string): Date {
  return new Date(iso.slice(0, 10) + 'T12:00:00')
}

export function businessExpensesTotalForDates(
  expenses: BusinessExpense[],
  start: Date,
  end: Date
): number {
  const startMs = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const endMs = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).getTime()

  let total = 0
  for (const exp of expenses) {
    const d = parseDateOnly(exp.date).getTime()
    if (d >= startMs && d <= endMs) total += exp.amount
  }
  return Math.round(total * 100) / 100
}
