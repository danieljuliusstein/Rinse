import type { Invoice, InvoiceStatus, Payment } from './types'

export const OVERDUE_DAYS = 3

export const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'Venmo',
  'Zelle',
  'CashApp',
  'Check',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** DET-YYYY-MM-NNN — NNN resets each calendar month */
export function generateInvoiceNumber(existing: Invoice[], date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const prefix = `DET-${y}-${m}-`

  const maxSeq = existing
    .filter((i) => i.invoice_number.startsWith(prefix))
    .reduce((max, i) => {
      const seq = parseInt(i.invoice_number.slice(prefix.length), 10)
      return Number.isNaN(seq) ? max : Math.max(max, seq)
    }, 0)

  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
}

export function computeInvoiceTotals(total: number, payments: Payment[]) {
  const amount_paid = payments.reduce((s, p) => s + p.amount, 0)
  const balance_due = Math.max(0, total - amount_paid)
  return { amount_paid, balance_due }
}

export function deriveInvoiceStatus(
  balance_due: number,
  amount_paid: number,
  current: InvoiceStatus,
  sent_at?: string
): InvoiceStatus {
  if (balance_due <= 0 && amount_paid > 0) return 'paid'
  if (amount_paid > 0 && balance_due > 0) return 'partial'
  if (current === 'paid') return 'paid'

  const effectiveSent = sent_at || (current === 'sent' || current === 'partial' || current === 'overdue' ? new Date().toISOString() : undefined)
  if (effectiveSent && isOverdue(effectiveSent, balance_due)) return 'overdue'
  if (current === 'sent' || current === 'overdue') return current
  return current
}

export function isOverdue(sent_at: string, balance_due: number, now = new Date()): boolean {
  if (balance_due <= 0) return false
  const sent = new Date(sent_at)
  const diffMs = now.getTime() - sent.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays > OVERDUE_DAYS
}

export function normalizeInvoice(invoice: Invoice, now = new Date()): Invoice {
  const { amount_paid, balance_due } = computeInvoiceTotals(invoice.total, invoice.payments)
  let status = deriveInvoiceStatus(balance_due, amount_paid, invoice.status, invoice.sent_at)

  if (
    invoice.sent_at &&
    balance_due > 0 &&
    isOverdue(invoice.sent_at, balance_due, now) &&
    status !== 'paid'
  ) {
    status = 'overdue'
  }

  return {
    ...invoice,
    amount_paid,
    balance_due,
    status,
    paid_at: status === 'paid' ? invoice.paid_at ?? now.toISOString() : undefined,
  }
}

export function buildInvoiceFromJob(params: {
  jobId: string
  clientId: string
  revenue: number
  tip: number
  invoiceNumber: string
  terms?: string
}): Omit<Invoice, 'id'> {
  const total = params.revenue + params.tip
  return {
    invoice_number: params.invoiceNumber,
    job_id: params.jobId,
    client_id: params.clientId,
    subtotal: params.revenue,
    tip: params.tip,
    total,
    status: 'draft',
    payments: [],
    amount_paid: 0,
    balance_due: total,
    terms: params.terms ?? 'Due on receipt',
  }
}
