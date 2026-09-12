import type { ExpenseLine, Job, JobWithRelations } from './types'

export function totalExpenses(job: Pick<Job, 'expenses' | 'travel_cost' | 'marketing_cost' | 'equipment_depreciation'>): number {
  const lineTotal = job.expenses.reduce((sum, e) => sum + e.amount, 0)
  return lineTotal + job.travel_cost + job.marketing_cost + job.equipment_depreciation
}

export function netProfit(job: Pick<Job, 'revenue' | 'tip' | 'expenses' | 'travel_cost' | 'marketing_cost' | 'equipment_depreciation'>): number {
  return job.revenue + job.tip - totalExpenses(job)
}

export function effectiveRate(job: Pick<Job, 'revenue' | 'tip' | 'hours_worked'>): number | null {
  if (job.hours_worked <= 0) return null
  return (job.revenue + job.tip) / job.hours_worked
}

export function marginPct(job: Pick<Job, 'revenue' | 'tip' | 'expenses' | 'travel_cost' | 'marketing_cost' | 'equipment_depreciation'>): number {
  const gross = job.revenue + job.tip
  if (gross === 0) return 0
  return Math.round((netProfit(job) / gross) * 100)
}

export function jobExpensesForDisplay(job: JobWithRelations): ExpenseLine[] {
  const lines = [...job.expenses]
  if (job.travel_cost > 0) {
    lines.push({ category: 'travel', description: '', amount: job.travel_cost })
  }
  if (job.marketing_cost > 0) {
    lines.push({ category: 'marketing', description: '', amount: job.marketing_cost })
  }
  if (job.equipment_depreciation > 0) {
    lines.push({ category: 'equipment', description: '', amount: job.equipment_depreciation })
  }
  return lines
}

export function mapJobStatusForDisplay(
  job: JobWithRelations
): 'paid' | 'invoiced' | 'scheduled' | 'completed' | 'overdue' | 'in_progress' {
  if (job.status === 'in_progress') return 'in_progress'
  if (job.status === 'paid') return 'paid'
  if (job.invoice?.status === 'overdue') return 'overdue'
  if (job.status === 'invoiced' || job.invoice?.status === 'sent' || job.invoice?.status === 'partial') return 'invoiced'
  if (job.status === 'scheduled') return 'scheduled'
  return 'completed'
}

export function formatScheduledLabel(date: string, startTime?: string): string {
  const jobDate = new Date(date + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const d = new Date(jobDate)
  d.setHours(0, 0, 0, 0)

  let dayLabel: string
  if (d.getTime() === today.getTime()) dayLabel = 'Today'
  else if (d.getTime() === tomorrow.getTime()) dayLabel = 'Tomorrow'
  else dayLabel = jobDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  if (startTime) {
    const [h, m] = startTime.split(':').map(Number)
    const dt = new Date()
    dt.setHours(h, m)
    return `${dayLabel} ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }
  return dayLabel
}

export interface FmtOptions {
  decimals?: number
  /** @deprecated Use default signed formatting; minus is always shown for negatives */
  forceSign?: boolean
  /** Show absolute magnitude (for expense rows displayed as positive red amounts) */
  unsigned?: boolean
}

/** Whole-dollar macro formatting for dashboards, lists, and reports. Negatives render as -$1,234. */
export const fmt = (n: number, opts?: FmtOptions) => {
  const decimals = opts?.decimals ?? 0
  const magnitude = opts?.unsigned ? Math.abs(n) : n
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(magnitude))
  if (!opts?.unsigned && n < 0) return `-${formatted}`
  return formatted
}

/** Invoice line items: show cents only when the amount has a fractional part. */
export function fmtLineItem(n: number): string {
  const hasCents = Math.round(Math.abs(n) * 100) % 100 !== 0
  return fmt(n, { decimals: hasCents ? 2 : 0 })
}

export const fmtDetailed = (n: number, _forceSign = false) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(n))
  if (n < 0) return `-${formatted}`
  return formatted
}

export function fmtSigned(n: number, decimals = 2): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(n))
  return n < 0 ? `-${formatted}` : formatted
}

export function isLoss(n: number): boolean {
  return n < 0
}
