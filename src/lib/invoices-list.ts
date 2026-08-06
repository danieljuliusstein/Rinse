import type { DeskInvoice, InvoiceStatus } from '@/lib/types'
import { money } from '@/lib/metrics'
import { agingBucket, type AgingBucket } from '@/lib/invoice-aging'

/** Mobile invoice tab filters — not every Desk InvoiceStatus. */
export type InvoiceFilterKey = 'all' | 'open' | 'paid' | 'overdue' | 'draft'

export const INVOICE_FILTERS: { key: InvoiceFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
  { key: 'draft', label: 'Draft' },
]

export type InvoiceListRow =
  | { kind: 'section'; key: string; label: string; total: number }
  | { kind: 'invoice'; inv: DeskInvoice }
  | { kind: 'section-total'; key: string; total: number; balanceDue: number }

function invoiceDate(inv: DeskInvoice): string {
  return inv.sent_at ?? inv.paid_at ?? inv.created ?? '1970-01-01'
}

function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function filterInvoices(invoices: DeskInvoice[], filter: InvoiceFilterKey): DeskInvoice[] {
  return invoices.filter((inv) => {
    if (filter === 'paid') return inv.status === 'paid'
    if (filter === 'draft') return inv.status === 'draft'
    if (filter === 'overdue') return inv.status === 'overdue'
    if (filter === 'open') return inv.status !== 'paid' && inv.status !== 'draft'
    return true
  })
}

export function searchInvoices(
  invoices: DeskInvoice[],
  query: string,
  clientNames: Map<string, string>,
): DeskInvoice[] {
  const q = query.trim().toLowerCase()
  if (!q) return invoices
  return invoices.filter((inv) => {
    const clientName = clientNames.get(inv.client_id) ?? ''
    return inv.invoice_number.toLowerCase().includes(q) || clientName.toLowerCase().includes(q)
  })
}

export function filterInvoicesByAging(
  invoices: DeskInvoice[],
  bucket: AgingBucket | null,
): DeskInvoice[] {
  if (!bucket) return invoices
  return invoices.filter((inv) => agingBucket(inv) === bucket)
}

export function groupInvoicesByMonth(invoices: DeskInvoice[]) {
  const map = new Map<string, DeskInvoice[]>()
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
        (a, b) => new Date(invoiceDate(b)).getTime() - new Date(invoiceDate(a)).getTime(),
      ),
      total: list.reduce((s, i) => s + i.total, 0),
      balanceDue: list.reduce((s, i) => s + i.balance_due, 0),
    }))
}

export function flattenInvoiceList(invoices: DeskInvoice[]): InvoiceListRow[] {
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

export function invoiceListSubtitle(inv: DeskInvoice): string {
  return inv.invoice_number || 'Invoice'
}

export function invoiceStatusChip(status: InvoiceStatus): {
  label: string
  bg: string
  fg: string
} {
  switch (status) {
    case 'paid':
      return { label: 'Paid', bg: '#D1FAE5', fg: '#065F46' }
    case 'draft':
      return { label: 'Draft', bg: '#F3F4F6', fg: '#4B5563' }
    case 'overdue':
      return { label: 'Overdue', bg: '#FEE2E2', fg: '#991B1B' }
    case 'partial':
      return { label: 'Partial', bg: '#FEF3C7', fg: '#92400E' }
    case 'void':
    case 'cancelled':
      return { label: status === 'void' ? 'Void' : 'Cancelled', bg: '#F3F4F6', fg: '#6B7280' }
    case 'sent':
    default:
      return { label: 'Sent', bg: '#FEF3C7', fg: '#B45309' }
  }
}

export function formatSectionTotal(total: number, balanceDue: number): string {
  if (balanceDue > 0 && balanceDue !== total) {
    return `${money(total)} · ${money(balanceDue)} due`
  }
  return money(total)
}

export function openBalanceTotal(invoices: DeskInvoice[]): number {
  return invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'draft')
    .reduce((s, i) => s + i.balance_due, 0)
}
