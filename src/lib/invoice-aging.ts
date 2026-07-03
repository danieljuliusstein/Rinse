import type { Invoice } from './types'

export function invoiceAgeDays(inv: Invoice, now = new Date()): number {
  const anchor = inv.sent_at ?? inv.paid_at
  if (!anchor) return 0
  const ms = now.getTime() - new Date(anchor).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export type AgingBucket = 'current' | '1-30' | '31-60' | '60+'

export function agingBucket(inv: Invoice, now = new Date()): AgingBucket {
  if (inv.status === 'paid' || inv.balance_due <= 0) return 'current'
  const days = invoiceAgeDays(inv, now)
  if (days <= 30) return '1-30'
  if (days <= 60) return '31-60'
  return '60+'
}

export const AGING_LABELS: Record<AgingBucket, string> = {
  current: 'Current',
  '1-30': '1–30 days',
  '31-60': '31–60 days',
  '60+': '60+ days',
}

export function summarizeAging(invoices: Invoice[]) {
  const open = invoices.filter((i) => i.status !== 'paid' && i.balance_due > 0)
  const buckets: Record<AgingBucket, { count: number; amount: number }> = {
    current: { count: 0, amount: 0 },
    '1-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '60+': { count: 0, amount: 0 },
  }
  for (const inv of open) {
    const b = agingBucket(inv)
    buckets[b].count += 1
    buckets[b].amount += inv.balance_due
  }
  return buckets
}
