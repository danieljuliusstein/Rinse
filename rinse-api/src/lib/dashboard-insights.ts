import { fmt } from './calculations'
import type { DashboardKpis, Invoice, JobWithRelations } from './types'

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
}

export function buildDashboardInsights(
  jobs: JobWithRelations[],
  invoices: Invoice[],
  kpis: DashboardKpis,
  priorRevenueMtd: number
): string[] {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const insights: string[] = []

  const mtdJobs = jobs.filter((j) => {
    const d = new Date(j.date + 'T12:00:00')
    return d >= monthStart && d <= monthEnd
  })

  const mtdInvoices = invoices.filter((inv) => {
    if (!inv.sent_at) return false
    const d = new Date(inv.sent_at + 'T12:00:00')
    return d >= monthStart && d <= monthEnd
  })

  if (mtdInvoices.length > 0) {
    const paidCount = mtdInvoices.filter((i) => i.status === 'paid').length
    const pct = Math.round((paidCount / mtdInvoices.length) * 100)
    if (pct === 100) {
      insights.push('100% of invoices paid this month')
    } else if (paidCount > 0) {
      insights.push(`${pct}% of invoices paid this month`)
    }
  }

  if (mtdJobs.length > 0) {
    const avg = Math.round(kpis.revenueMtd / mtdJobs.length)
    insights.push(`Average job value: ${fmt(avg)}`)
  }

  const packageRevenue = new Map<string, number>()
  for (const job of mtdJobs) {
    const name = job.package?.name ?? 'Other'
    packageRevenue.set(name, (packageRevenue.get(name) ?? 0) + job.revenue + job.tip)
  }
  const topPackage = [...packageRevenue.entries()].sort((a, b) => b[1] - a[1])[0]
  if (topPackage && topPackage[1] > 0) {
    insights.push(`Best-performing service: ${topPackage[0]}`)
  }

  if (priorRevenueMtd > 0 && kpis.revenueMtd !== priorRevenueMtd) {
    const change = Math.round(((kpis.revenueMtd - priorRevenueMtd) / priorRevenueMtd) * 100)
    if (change > 0) {
      insights.push(`Revenue is up ${change}% compared to last month`)
    } else if (change < 0) {
      insights.push(`Revenue is down ${Math.abs(change)}% compared to last month`)
    }
  } else if (priorRevenueMtd === 0 && kpis.revenueMtd > 0) {
    insights.push('Revenue is up compared to last month')
  }

  if (kpis.marginMtd >= 50 && kpis.revenueMtd > 0) {
    insights.push(`${kpis.marginMtd}% profit margin this month`)
  }

  if (kpis.outstanding > 0) {
    insights.push(`${fmt(kpis.outstanding)} outstanding across ${kpis.outstandingInvoiceCount} invoice${kpis.outstandingInvoiceCount === 1 ? '' : 's'}`)
  }

  return insights
}

export function pickDashboardInsight(insights: string[], seed = new Date().getDate()): string | null {
  if (insights.length === 0) return null
  return insights[seed % insights.length]
}
