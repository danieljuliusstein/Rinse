import type { Invoice } from '@rinse/core'
import { fmt } from '@rinse/core'
import { agingBucket, type AgingBucket } from './invoice-aging'

export type InvoiceFilterKey = 'all' | 'open' | 'paid' | 'overdue' | 'draft'

export const INVOICE_FILTERS: { key: InvoiceFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
  { key: 'draft', label: 'Draft' },
]

export const AGING_FILTER_BUCKETS: AgingBucket[] = ['1-30', '31-60', '60+']

export type InvoiceListRow =
  | { kind: 'section'; key: string; label: string; total: number }
  | { kind: 'invoice'; inv: Invoice }
  | { kind: 'section-total'; key: string; total: number; balanceDue: number }

function invoiceDate(inv: Invoice): string {
  return inv.sent_at ?? inv.paid_at ?? '1970-01-01'
}

function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function filterInvoices(invoices: Invoice[], filter: InvoiceFilterKey): Invoice[] {
  return invoices.filter((inv) => {
    if (filter === 'paid') return inv.status === 'paid'
    if (filter === 'draft') return inv.status === 'draft'
    if (filter === 'overdue') return inv.status === 'overdue'
    if (filter === 'open') return inv.status !== 'paid' && inv.status !== 'draft'
    return true
  })
}

export function searchInvoices(
  invoices: Invoice[],
  query: string,
  clientNames: Map<string, string>
): Invoice[] {
  const q = query.trim().toLowerCase()
  if (!q) return invoices
  return invoices.filter((inv) => {
    const clientName = clientNames.get(inv.client_id) ?? ''
    return inv.invoice_number.toLowerCase().includes(q) || clientName.toLowerCase().includes(q)
  })
}

export function filterInvoicesByAging(invoices: Invoice[], bucket: AgingBucket | null): Invoice[] {
  if (!bucket) return invoices
  return invoices.filter((inv) => agingBucket(inv) === bucket)
}

export function groupInvoicesByMonth(invoices: Invoice[]) {
  const map = new Map<string, Invoice[]>()
  for (const inv of invoices) {
    const key = monthKey(invoiceDate(inv))
    const list = map.get(key) ?? []
    list.push(inv)
    map.set(key, list)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, list]) => ({
      key,
      label: monthLabel(key),
      invoices: [...list].sort(
        (a, b) => new Date(invoiceDate(b)).getTime() - new Date(invoiceDate(a)).getTime()
      ),
      total: list.reduce((s, i) => s + i.total, 0),
      balanceDue: list.reduce((s, i) => s + i.balance_due, 0),
    }))
}

export function flattenInvoiceList(invoices: Invoice[]): InvoiceListRow[] {
  const rows: InvoiceListRow[] = []
  for (const section of groupInvoicesByMonth(invoices)) {
    rows.push({ kind: 'section', key: section.key, label: section.label, total: section.total })
    for (const inv of section.invoices) {
      rows.push({ kind: 'invoice', inv })
    }
    rows.push({
      kind: 'section-total',
      key: `${section.key}-total`,
      total: section.total,
      balanceDue: section.balanceDue,
    })
  }
  return rows
}

export function invoiceListSubtitle(inv: Invoice, clientName?: string): string {
  const parts = [inv.invoice_number]
  if (clientName) parts.push(clientName)
  return parts.join(' · ')
}

export function invoiceStatusChip(status: Invoice['status']): {
  label: string
  tone: 'draft' | 'green' | 'amber' | 'yellow' | 'red'
} {
  switch (status) {
    case 'paid':
      return { label: 'Paid', tone: 'green' }
    case 'draft':
      return { label: 'Draft', tone: 'draft' }
    case 'overdue':
      return { label: 'Overdue', tone: 'red' }
    case 'partial':
      return { label: 'Partial', tone: 'yellow' }
    case 'sent':
    default:
      return { label: 'Sent', tone: 'amber' }
  }
}

export function formatSectionTotal(total: number, balanceDue: number): string {
  if (balanceDue > 0 && balanceDue !== total) {
    return `${fmt(total)} · ${fmt(balanceDue)} due`
  }
  return fmt(total)
}
