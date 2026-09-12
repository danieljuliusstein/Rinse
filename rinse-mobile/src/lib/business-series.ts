import type { BusinessExpense, JobWithRelations, OverheadExpense } from '@rinse/core'
import { overheadForDateRange, sumBusinessExpensesInRange } from '@/src/lib/expense-totals'
import { jobInRange } from '@/src/lib/reports'

export type BusinessDayPoint = {
  iso: string
  label: string
  jobs: number
  revenue: number
  expenses: number
  net: number
}

export type WeeklyCompareBucket = {
  label: string
  revenue: number
  expenses: number
}

function toIsoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

function jobDayExpenses(job: JobWithRelations): number {
  let total = job.travel_cost + job.equipment_depreciation + job.marketing_cost
  for (const e of job.expenses ?? []) total += e.amount
  return total
}

/**
 * Build per-day revenue / job-expense points for sparklines.
 * Overhead + business expenses are spread evenly across days in the range
 * so daily net tracks the period PL shape without inventing fake spikes.
 * Ranges longer than ~3 months collapse to weekly points for performance.
 */
export function buildBusinessDaySeries(
  jobs: JobWithRelations[],
  businessExpenses: BusinessExpense[],
  overheadItems: OverheadExpense[],
  start: Date,
  end: Date,
): BusinessDayPoint[] {
  const from = startOfDay(start)
  const to = startOfDay(end)
  if (to < from) return []

  const days = Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1
  const periodOverhead = overheadForDateRange(overheadItems, start, end)
  const periodBusiness = sumBusinessExpensesInRange(businessExpenses, start, end)

  const byDay = new Map<string, { jobs: number; revenue: number; expenses: number }>()

  for (const job of jobs) {
    if (!jobInRange(job, start, end)) continue
    const iso = job.date.slice(0, 10)
    const cur = byDay.get(iso) ?? { jobs: 0, revenue: 0, expenses: 0 }
    cur.jobs += 1
    cur.revenue += job.revenue + job.tip
    cur.expenses += jobDayExpenses(job)
    byDay.set(iso, cur)
  }

  const step = days > 366 ? 30 : days > 92 ? 7 : 1
  const bucketCount = Math.ceil(days / step)
  const dailyFixed = bucketCount > 0 ? (periodOverhead + periodBusiness) / bucketCount : 0

  const points: BusinessDayPoint[] = []
  for (let b = 0; b < bucketCount; b++) {
    const bucketStart = addDays(from, b * step)
    let jobsCount = 0
    let revenue = 0
    let expenses = 0
    for (let i = 0; i < step; i++) {
      const d = addDays(bucketStart, i)
      if (d > to) break
      const cur = byDay.get(toIsoLocal(d))
      if (!cur) continue
      jobsCount += cur.jobs
      revenue += cur.revenue
      expenses += cur.expenses
    }
    expenses += dailyFixed
    points.push({
      iso: toIsoLocal(bucketStart),
      label: String(bucketStart.getDate()).padStart(2, '0'),
      jobs: jobsCount,
      revenue,
      expenses,
      net: revenue - expenses,
    })
  }

  return points
}

/** Collapse day series into up to `maxBuckets` weekly compare groups. */
export function buildWeeklyCompareSeries(
  days: BusinessDayPoint[],
  maxBuckets = 4,
): WeeklyCompareBucket[] {
  if (days.length === 0) return []

  const bucketCount = Math.min(maxBuckets, Math.max(1, Math.ceil(days.length / 7)))
  const size = Math.ceil(days.length / bucketCount)
  const buckets: WeeklyCompareBucket[] = []

  for (let i = 0; i < bucketCount; i++) {
    const slice = days.slice(i * size, i * size + size)
    if (slice.length === 0) continue
    buckets.push({
      label: `W${i + 1}`,
      revenue: slice.reduce((s, d) => s + d.revenue, 0),
      expenses: slice.reduce((s, d) => s + d.expenses, 0),
    })
  }

  return buckets
}

export function seriesValues(
  days: BusinessDayPoint[],
  key: 'revenue' | 'expenses' | 'net' | 'avg',
): number[] {
  if (key === 'avg') {
    return days.map((d) => (d.jobs > 0 ? d.revenue / d.jobs : 0))
  }
  return days.map((d) => d[key])
}

/** Prefer days with activity for sparklines; downsample long ranges; pad to ≥2 points. */
export function sparklineValues(values: number[], minPoints = 2, maxPoints = 48): number[] {
  if (values.length === 0) return [0, 0]

  let source = values
  if (source.length > maxPoints) {
    const step = source.length / maxPoints
    const sampled: number[] = []
    for (let i = 0; i < maxPoints; i++) {
      sampled.push(source[Math.min(source.length - 1, Math.floor(i * step))])
    }
    source = sampled
  }

  if (source.length >= minPoints) return source
  if (source.length === 1) return [source[0], source[0]]
  return [0, 0]
}
