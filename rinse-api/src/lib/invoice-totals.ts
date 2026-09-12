import { normalizeInvoice } from './invoices'
import type { Invoice } from './types'

export function recalculateInvoiceTotals(invoice: Invoice): Invoice {
  const discount = invoice.discount_amount ?? 0
  const taxRate = invoice.tax_rate ?? 0
  const base = invoice.subtotal + invoice.tip
  const afterDiscount = Math.max(0, base - discount)
  const taxAmount = taxRate > 0 ? Math.round(afterDiscount * (taxRate / 100) * 100) / 100 : 0
  const total = Math.round((afterDiscount + taxAmount) * 100) / 100
  return normalizeInvoice({ ...invoice, total, tax_amount: taxAmount })
}
