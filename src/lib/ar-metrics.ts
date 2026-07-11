import type { Invoice } from '@rinse/core'

export interface ArSummary {
  totalInvoiced: number
  unpaid: number
  overdueCount: number
  openCount: number
  collectedThisMonth: number
}

export function computeArSummary(invoices: Invoice[]): ArSummary {
  let totalInvoiced = 0
  let unpaid = 0
  let overdueCount = 0
  let openCount = 0
  let collectedThisMonth = 0

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1

  for (const inv of invoices) {
    totalInvoiced += inv.total
    if (inv.status !== 'paid') {
      unpaid += inv.balance_due
      openCount += 1
      if (inv.status === 'overdue') overdueCount += 1
    }
    if (inv.status === 'paid' && inv.paid_at) {
      const [y, m] = inv.paid_at.split('-').map(Number)
      if (y === thisYear && m === thisMonth) collectedThisMonth += inv.total
    }
  }

  return { totalInvoiced, unpaid, overdueCount, openCount, collectedThisMonth }
}

export function growthPct(current: number, prior: number): number | null {
  if (prior <= 0) return current > 0 ? 100 : null
  return Math.round(((current - prior) / prior) * 100)
}
