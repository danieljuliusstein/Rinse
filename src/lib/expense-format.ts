export function monthKey(date: string): string {
  return date.slice(0, 7)
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function formatExpenseDate(date: string): string {
  const d = new Date(`${date.slice(0, 10)}T12:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
