import { normalizeReturnDays } from './package-cadence'

const MS_PER_DAY = 86_400_000

function parseDate(iso: string): Date {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  d.setHours(12, 0, 0, 0)
  return d
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function suggestNextServiceDate(lastJobDate: string, expectedReturnDays: number): string {
  const cadence = normalizeReturnDays(expectedReturnDays)
  const next = parseDate(lastJobDate)
  next.setDate(next.getDate() + cadence)
  return toIsoDate(next)
}

export function daysUntilNextService(lastJobDate: string, expectedReturnDays: number, now = new Date()): number {
  const suggested = suggestNextServiceDate(lastJobDate, expectedReturnDays)
  const target = parseDate(suggested)
  const today = new Date(now)
  today.setHours(12, 0, 0, 0)
  return Math.floor((target.getTime() - today.getTime()) / MS_PER_DAY)
}
