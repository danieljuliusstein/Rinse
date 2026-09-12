import type { MonthCarouselItem } from '@/components/ui/MonthCarousel'
import { growthPct } from './ar-metrics'
import type { Invoice } from './types'

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function collectedInMonth(invoices: Invoice[], year: number, month: number): number {
  return invoices
    .filter((inv) => {
      const dateStr = inv.paid_at ?? inv.sent_at
      if (!dateStr) return false
      const [y, m] = dateStr.split('-').map(Number)
      return y === year && m === month + 1 && inv.status === 'paid'
    })
    .reduce((s, inv) => s + inv.total, 0)
}

export function buildInvoiceMonthCarouselItems(
  invoices: Invoice[],
  months = 4,
  activeMonth?: string
): MonthCarouselItem[] {
  const now = new Date()
  const items: MonthCarouselItem[] = []

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(d)
    const rev = collectedInMonth(invoices, d.getFullYear(), d.getMonth())
    const prior = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    const priorRev = collectedInMonth(invoices, prior.getFullYear(), prior.getMonth())
    const delta = growthPct(rev, priorRev)

    items.push({
      id: key,
      label: monthLabel(d),
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(rev),
      delta: delta != null ? `${delta >= 0 ? '+' : ''}${delta}%` : undefined,
      deltaDirection:
        delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
      active: activeMonth ? key === activeMonth : i === 0,
    })
  }

  return items
}

export function collectedThisMonth(invoices: Invoice[]): number {
  const now = new Date()
  return collectedInMonth(invoices, now.getFullYear(), now.getMonth())
}
