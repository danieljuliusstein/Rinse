import type { DeskInvoice, DeskInvoiceLineItem, InvoiceStatus } from '@/lib/types'
import { normalizeDeskInvoice } from '@/lib/invoice-status'

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
  tip: string
  amount_paid: string
  discount_amount: string
  tax_rate: string
  po_number: string
  /** Job package / base revenue portion of subtotal (before extras). */
  job_revenue: string
  extra_line_items: DeskInvoiceLineItem[]
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function lineAmount(line: Pick<DeskInvoiceLineItem, 'quantity' | 'unit_price' | 'default_amount'>): number {
  const qty = line.quantity
  const price = line.unit_price
  if (
    typeof qty === 'number' &&
    typeof price === 'number' &&
    Number.isFinite(qty) &&
    Number.isFinite(price)
  ) {
    return roundMoney(qty * price)
  }
  return roundMoney(Number(line.default_amount ?? 0))
}

export function sumLineAmounts(lines: DeskInvoiceLineItem[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + lineAmount(line), 0))
}

export function newInvoiceLine(partial?: Partial<DeskInvoiceLineItem>): DeskInvoiceLineItem {
  const quantity = partial?.quantity ?? 1
  const unit_price = partial?.unit_price ?? 0
  return {
    id: partial?.id || `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: partial?.description ?? '',
    quantity,
    unit_price,
    unit: partial?.unit ?? 'each',
    default_amount: roundMoney(quantity * unit_price),
  }
}

/** Infer job/package revenue from invoice: subtotal minus extras. */
export function inferJobRevenue(inv: DeskInvoice): number {
  const extras = sumLineAmounts(inv.extra_line_items ?? [])
  return roundMoney(Math.max(0, inv.subtotal - extras))
}

export function valuesFromInvoice(inv: DeskInvoice): InvoiceEditValues {
  return {
    status: inv.status,
    tip: String(inv.tip ?? 0),
    amount_paid: String(inv.amount_paid ?? 0),
    discount_amount: String(inv.discount_amount ?? 0),
    tax_rate: String(inv.tax_rate ?? 0),
    po_number: inv.po_number ?? '',
    job_revenue: String(inferJobRevenue(inv)),
    extra_line_items: (inv.extra_line_items ?? []).map((l) => ({ ...l })),
  }
}

export function previewInvoiceTotals(values: InvoiceEditValues): {
  subtotal: number
  tip: number
  discount: number
  tax_rate: number
  tax_amount: number
  total: number
  amount_paid: number
  balance_due: number
} {
  const tip = Number(values.tip) || 0
  const jobRevenue = Number(values.job_revenue) || 0
  const extras = sumLineAmounts(values.extra_line_items)
  const subtotal = roundMoney(jobRevenue + extras)
  const discount = Math.max(0, Number(values.discount_amount) || 0)
  const tax_rate = Math.max(0, Number(values.tax_rate) || 0)
  const base = subtotal + tip
  const afterDiscount = Math.max(0, base - discount)
  const tax_amount =
    tax_rate > 0 ? roundMoney(afterDiscount * (tax_rate / 100)) : 0
  const total = roundMoney(afterDiscount + tax_amount)
  let amount_paid = Number(values.amount_paid) || 0
  if (amount_paid < 0) amount_paid = 0
  if (amount_paid > total) amount_paid = total
  const balance_due = Math.max(total - amount_paid, 0)
  return { subtotal, tip, discount, tax_rate, tax_amount, total, amount_paid, balance_due }
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
  discount_amount: number
  tax_rate: number
  tax_amount: number
  po_number: string
  extra_line_items: DeskInvoiceLineItem[]
  paid_at?: string | null
  sent_at?: string
} {
  const requested = values.status as InvoiceStatus
  const preview = previewInvoiceTotals(values)
  let amount_paid = preview.amount_paid
  if (requested === 'paid' && amount_paid <= 0) amount_paid = preview.total
  const balance_due = Math.max(preview.total - amount_paid, 0)

  const extras = values.extra_line_items
    .filter((l) => l.description.trim())
    .map((l) => {
      const quantity = typeof l.quantity === 'number' ? l.quantity : 1
      const unit_price =
        typeof l.unit_price === 'number' ? l.unit_price : Number(l.default_amount ?? 0)
      return {
        ...l,
        description: l.description.trim(),
        quantity,
        unit_price,
        default_amount: roundMoney(quantity * unit_price),
      }
    })

  let sent_at = inv.sent_at
  if ((requested === 'sent' || requested === 'overdue') && !sent_at) {
    sent_at = new Date().toISOString()
  }

  const normalized = normalizeDeskInvoice({
    ...inv,
    status: requested,
    total: preview.total,
    tip: preview.tip,
    subtotal: preview.subtotal,
    amount_paid,
    balance_due: requested === 'paid' ? 0 : balance_due,
    sent_at,
  })

  const status =
    requested === 'void' || requested === 'cancelled' || requested === 'draft'
      ? requested
      : normalized.status

  const patch: {
    status: InvoiceStatus
    total: number
    tip: number
    subtotal: number
    amount_paid: number
    balance_due: number
    discount_amount: number
    tax_rate: number
    tax_amount: number
    po_number: string
    extra_line_items: DeskInvoiceLineItem[]
    paid_at?: string | null
    sent_at?: string
  } = {
    status,
    total: preview.total,
    tip: preview.tip,
    subtotal: preview.subtotal,
    amount_paid,
    balance_due: status === 'paid' ? 0 : balance_due,
    discount_amount: preview.discount,
    tax_rate: preview.tax_rate,
    tax_amount: preview.tax_amount,
    po_number: values.po_number.trim(),
    extra_line_items: extras,
  }
  if (status === 'paid') {
    patch.paid_at = inv.paid_at || new Date().toISOString()
  } else if (inv.status === 'paid') {
    patch.paid_at = null
  }
  if (sent_at && sent_at !== inv.sent_at) {
    patch.sent_at = sent_at
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
