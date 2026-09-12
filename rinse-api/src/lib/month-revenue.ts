import type { MonthCarouselItem } from '@/components/ui/MonthCarousel'
import { growthPct } from './ar-metrics'
import type { JobWithRelations } from './types'

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function revenueInMonth(jobs: JobWithRelations[], year: number, month: number): number {
  return jobs
    .filter((j) => {
      const [y, m] = j.date.split('-').map(Number)
      return y === year && m === month + 1
    })
    .reduce((s, j) => s + j.revenue + j.tip, 0)
}

export function buildMonthCarouselItems(
  jobs: JobWithRelations[],
  months = 4,
  activeMonth?: string
): MonthCarouselItem[] {
  const now = new Date()
  const items: MonthCarouselItem[] = []

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(d)
    const rev = revenueInMonth(jobs, d.getFullYear(), d.getMonth())
    const prior = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    const priorRev = revenueInMonth(jobs, prior.getFullYear(), prior.getMonth())
    const delta = growthPct(rev, priorRev)

    items.push({
      id: key,
      label: monthLabel(d),
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(rev),
      delta:
        delta != null ? `${delta >= 0 ? '+' : ''}${delta}%` : undefined,
      deltaDirection:
        delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
      active: activeMonth ? key === activeMonth : i === 0,
    })
  }

  return items
}

export interface MonthCalendarDay {
  date: string
  dayNum: number
  inMonth: boolean
  isToday: boolean
  jobCount: number
}

export function buildMonthCalendarDays(
  jobs: JobWithRelations[],
  viewDate = new Date()
): MonthCalendarDay[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const jobCounts = new Map<string, number>()
  for (const j of jobs) {
    jobCounts.set(j.date, (jobCounts.get(j.date) ?? 0) + 1)
  }

  const cells: MonthCalendarDay[] = []

  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, -startPad + i + 1)
    const iso = d.toISOString().split('T')[0]
    cells.push({
      date: iso,
      dayNum: d.getDate(),
      inMonth: false,
      isToday: iso === todayStr,
      jobCount: jobCounts.get(iso) ?? 0,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      date: iso,
      dayNum: day,
      inMonth: true,
      isToday: iso === todayStr,
      jobCount: jobCounts.get(iso) ?? 0,
    })
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]
    const d = new Date(last.date + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const iso = d.toISOString().split('T')[0]
    cells.push({
      date: iso,
      dayNum: d.getDate(),
      inMonth: false,
      isToday: iso === todayStr,
      jobCount: jobCounts.get(iso) ?? 0,
    })
  }

  return cells
}
