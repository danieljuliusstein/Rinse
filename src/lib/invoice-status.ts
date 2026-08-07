/**
 * Mobile / `@rinse/core` parity for invoice overdue.
 * Sent invoices with balance due become overdue after OVERDUE_DAYS (not only when PB status is stored as overdue).
 */
import type { DeskInvoice, InvoiceStatus } from '@/lib/types'

/** Matches packages/core `OVERDUE_DAYS`. */
export const OVERDUE_DAYS = 3

export function isInvoiceOverdue(
  sent_at: string,
  balance_due: number,
  now = new Date(),
): boolean {
  if (balance_due <= 0) return false
  const sent = new Date(sent_at)
  if (Number.isNaN(sent.getTime())) return false
  const diffDays = (now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > OVERDUE_DAYS
}

/**
 * Derive display/write status from balances + sent_at.
 * Mirrors `@rinse/core` `deriveInvoiceStatus` (+ Desk void/cancelled).
 */
export function deriveInvoiceStatus(
  balance_due: number,
  amount_paid: number,
  current: InvoiceStatus,
  sent_at?: string,
  now = new Date(),
): InvoiceStatus {
  if (current === 'void' || current === 'cancelled') return current
  if (balance_due <= 0 && amount_paid > 0) return 'paid'
  if (amount_paid > 0 && balance_due > 0) return 'partial'
  if (current === 'paid') return 'paid'

  const effectiveSent =
    sent_at ||
    (current === 'sent' || current === 'partial' || current === 'overdue'
      ? now.toISOString()
      : undefined)
  if (effectiveSent && isInvoiceOverdue(effectiveSent, balance_due, now)) return 'overdue'
  if (current === 'sent' || current === 'overdue') return current
  return current
}

/** Apply overdue derivation on a mapped invoice (mobile `normalizeInvoice` status pass). */
export function normalizeDeskInvoice(invoice: DeskInvoice, now = new Date()): DeskInvoice {
  if (invoice.status === 'void' || invoice.status === 'cancelled') return invoice

  const amount_paid = Number(invoice.amount_paid) || 0
  const balance_due =
    invoice.balance_due != null && Number.isFinite(invoice.balance_due)
      ? Math.max(0, Number(invoice.balance_due))
      : Math.max(0, Number(invoice.total) - amount_paid)

  let status = deriveInvoiceStatus(
    balance_due,
    amount_paid,
    invoice.status,
    invoice.sent_at,
    now,
  )

  if (
    invoice.sent_at &&
    balance_due > 0 &&
    isInvoiceOverdue(invoice.sent_at, balance_due, now) &&
    status !== 'paid'
  ) {
    status = 'overdue'
  }

  return {
    ...invoice,
    amount_paid,
    balance_due,
    status,
  }
}
