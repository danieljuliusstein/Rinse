import type { DeskInvoice, InvoiceStatus } from '@/lib/types'

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
  { value: 'cancelled', label: 'Cancelled' },
]

export type InvoiceEditValues = {
  status: string
  total: string
  amount_paid: string
  tip?: string
}

export function buildInvoiceUpdatePatch(
  inv: DeskInvoice,
  values: InvoiceEditValues,
): {
  status: InvoiceStatus
  total: number
  tip: number
  subtotal: number
  amount_paid: number
  balance_due: number
  paid_at?: string | null
  sent_at?: string
} {
  const status = values.status as InvoiceStatus
  const total = Number(values.total) || 0
  const tip = Number(values.tip) || 0
  let amount_paid = Number(values.amount_paid) || 0
  if (amount_paid < 0) amount_paid = 0
  if (amount_paid > total) amount_paid = total
  if (status === 'paid' && amount_paid <= 0) amount_paid = total
  const balance_due = Math.max(total - amount_paid, 0)
  const patch: {
    status: InvoiceStatus
    total: number
    tip: number
    subtotal: number
    amount_paid: number
    balance_due: number
    paid_at?: string | null
    sent_at?: string
  } = {
    status,
    total,
    tip,
    subtotal: Math.max(total - tip, 0),
    amount_paid,
    balance_due: status === 'paid' ? 0 : balance_due,
  }
  if (status === 'paid') {
    patch.paid_at = inv.paid_at || new Date().toISOString()
  } else if (inv.status === 'paid') {
    patch.paid_at = null
  }
  if (status === 'sent' && !inv.sent_at) {
    patch.sent_at = new Date().toISOString()
  }
  return patch
}

/** Payment receipts: paid or partial inflow, excluding void/cancelled. */
export function isPaymentReceiptInvoice(inv: DeskInvoice): boolean {
  if (inv.status === 'void' || inv.status === 'cancelled') return false
  return inv.status === 'paid' || inv.amount_paid > 0
}

export function paymentReceiptDate(inv: DeskInvoice): string {
  if (inv.paid_at) return inv.paid_at.slice(0, 10)
  if (inv.created) return inv.created.slice(0, 10)
  return ''
}
