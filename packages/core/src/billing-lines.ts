import { fmt } from './calculations'
import type { InvoiceLineTemplate, InvoiceLineUnit } from './types'

export const INVOICE_LINE_UNITS = ['each', 'hour', 'flat'] as const

export const INVOICE_LINE_UNIT_OPTIONS: { value: InvoiceLineUnit; label: string }[] = [
  { value: 'each', label: 'Each' },
  { value: 'hour', label: 'Hour' },
  { value: 'flat', label: 'Flat' },
]

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** Line total: quantity × unit_price when present, else legacy default_amount. */
export function lineAmount(line: {
  quantity?: number
  unit_price?: number
  default_amount?: number
}): number {
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

export function sumLineAmounts(
  lines: Array<{ quantity?: number; unit_price?: number; default_amount?: number }>,
): number {
  return roundMoney(lines.reduce((sum, line) => sum + lineAmount(line), 0))
}

function coerceUnit(unit: unknown): InvoiceLineUnit {
  if (unit === 'hour' || unit === 'flat' || unit === 'each') return unit
  return 'each'
}

/**
 * Normalize a stored or partial line so quantity / unit_price / unit / default_amount
 * stay in sync. Legacy rows with only default_amount become qty=1 × that price.
 */
export function normalizeBillingLine(
  input: Partial<InvoiceLineTemplate> & { description: string; id?: string },
): InvoiceLineTemplate {
  const hasHybrid =
    typeof input.quantity === 'number' &&
    Number.isFinite(input.quantity) &&
    typeof input.unit_price === 'number' &&
    Number.isFinite(input.unit_price)

  const quantity = hasHybrid
    ? Math.max(0, input.quantity as number)
    : typeof input.quantity === 'number' && Number.isFinite(input.quantity) && input.quantity > 0
      ? input.quantity
      : 1

  const unit_price = hasHybrid
    ? (input.unit_price as number)
    : typeof input.unit_price === 'number' && Number.isFinite(input.unit_price)
      ? input.unit_price
      : Number(input.default_amount ?? 0)

  const unit = coerceUnit(input.unit)
  const default_amount = roundMoney(quantity * unit_price)

  return {
    id: input.id ?? '',
    description: input.description,
    quantity,
    unit_price,
    unit,
    default_amount,
    category: input.category,
    active: input.active,
  }
}

export function normalizeBillingLines(
  lines: Array<Partial<InvoiceLineTemplate> & { description?: string; id?: string }> | undefined | null,
): InvoiceLineTemplate[] {
  if (!Array.isArray(lines)) return []
  return lines
    .filter((line) => line && typeof line.description === 'string' && line.description.trim())
    .map((line) =>
      normalizeBillingLine({
        ...line,
        description: String(line.description),
        id: line.id ? String(line.id) : undefined,
      }),
    )
}

/** Secondary label for PDFs / lists, e.g. "2.5 hr × $50/hr". */
export function formatBillingLineDetail(line: {
  quantity?: number
  unit_price?: number
  unit?: InvoiceLineUnit
  default_amount?: number
}): string | undefined {
  const quantity =
    typeof line.quantity === 'number' && Number.isFinite(line.quantity) ? line.quantity : 1
  const unit_price =
    typeof line.unit_price === 'number' && Number.isFinite(line.unit_price)
      ? line.unit_price
      : Number(line.default_amount ?? 0)
  const unit = coerceUnit(line.unit)

  if (unit === 'flat') return undefined
  if (unit === 'hour') {
    if (quantity === 1) return `${fmt(unit_price)}/hr`
    return `${quantity} hr × ${fmt(unit_price)}/hr`
  }
  if (quantity === 1) return undefined
  return `${quantity} × ${fmt(unit_price)}`
}
