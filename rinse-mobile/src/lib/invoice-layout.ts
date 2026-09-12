import { fmt } from '@rinse/core'
import {
  formatBillingLineDetail,
  lineAmount,
  normalizeBillingLines,
  sumLineAmounts,
} from '@rinse/core'
import type { Invoice, InvoiceStatus, JobWithRelations } from '@rinse/core'
import { hasCustomBusinessLogo } from '@/src/lib/business-logo'
import { normalizeAccentColor } from '@/src/lib/brand-color'
import type { InvoiceTemplateId } from '@/src/lib/invoice-templates'
import type { AppSettings } from '@/src/lib/settings-store'

export const INVOICE_ACCENT = '#22c55e'

export const INVOICE_STATUS_COLORS = {
  paid: INVOICE_ACCENT,
  sent: '#3b82f6',
  overdue: '#ef4444',
  draft: '#888888',
  partial: '#f59e0b',
} as const

export interface InvoiceLineItem {
  description: string
  note?: string
  amount: number
}

export interface InvoicePaymentRow {
  method: string
  date: string
  amount: number
}

export interface InvoiceViewModel {
  /** From Settings → Invoicing — applied to every invoice. */
  template: InvoiceTemplateId
  businessName: string
  businessPhone?: string
  businessEmail?: string
  businessAddress?: string
  logoUrl?: string
  accent: string
  invoiceNumber: string
  issuedDateLabel: string
  statusLabel: string
  statusTone: InvoiceStatus
  billToName: string
  billToPhone?: string
  billToEmail?: string
  billToAddress?: string
  serviceDateLabel: string
  vehicleLabel: string
  locationLabel: string
  serviceContextLine: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  tip: number
  discount?: number
  taxRate?: number
  taxAmount?: number
  poNumber?: string
  total: number
  balanceDue: number
  showTip: boolean
  showDiscount: boolean
  showTax: boolean
  payments: InvoicePaymentRow[]
  showPayments: boolean
  /** Systemwide footer from Settings → Invoicing. */
  termsFooter: string
  questionsLine?: string
  portalUrl?: string
  isPaid: boolean
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatLongDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function locationDetailLabel(locationType: string): string {
  return locationType === 'mobile' ? 'Mobile detail' : 'Shop detail'
}

function statusDisplay(status: InvoiceStatus): { label: string; tone: InvoiceStatus } {
  switch (status) {
    case 'paid':
      return { label: 'PAID', tone: 'paid' }
    case 'overdue':
      return { label: 'OVERDUE', tone: 'overdue' }
    case 'sent':
      return { label: 'SENT', tone: 'sent' }
    case 'partial':
      return { label: 'PARTIAL', tone: 'partial' }
    default:
      return { label: 'DRAFT', tone: 'draft' }
  }
}

export function formatInvoiceMoney(amount: number): string {
  return fmt(amount)
}

export function extrasTotal(invoice: Invoice): number {
  return sumLineAmounts(normalizeBillingLines(invoice.extra_line_items))
}

export function buildInvoiceViewModel(
  job: JobWithRelations,
  invoice: Invoice,
  settings: AppSettings,
  options?: { portalUrl?: string },
): InvoiceViewModel {
  const client = job.client
  const packageName = job.package?.name?.trim() || 'Detailing service'
  const vehicleLabel = capitalize(job.vehicle_type)
  const locationLabel = locationDetailLabel(job.location_type)
  const serviceDateLabel = formatLongDate(job.date)
  const issuedSource = invoice.sent_at?.trim() || job.date
  const { label: statusLabel, tone: statusTone } = statusDisplay(invoice.status)

  const extras = normalizeBillingLines(invoice.extra_line_items)
  const lineItems: InvoiceLineItem[] = [
    {
      description: packageName,
      note: job.notes?.trim() || undefined,
      amount: job.revenue,
    },
    ...extras.map((line) => ({
      description: line.description,
      note: formatBillingLineDetail(line),
      amount: lineAmount(line),
    })),
  ]

  const lineSubtotal = job.revenue + sumLineAmounts(extras)
  const questionsParts: string[] = []
  if (settings.business_email) questionsParts.push(settings.business_email)
  if (settings.business_phone) questionsParts.push(settings.business_phone)

  const discount = invoice.discount_amount ?? 0
  const taxRate = invoice.tax_rate ?? 0
  const taxAmount = invoice.tax_amount ?? 0
  // Appearance + footer always come from Settings → Invoicing (systemwide).
  const termsFooter =
    settings.invoice_terms_footer?.trim() || 'Due on receipt. Thank you for your business.'

  return {
    template: settings.invoice_template ?? 'rinse',
    businessName: settings.business_name?.trim() || 'Your business',
    businessPhone: settings.business_phone?.trim() || undefined,
    businessEmail: settings.business_email?.trim() || undefined,
    businessAddress: settings.business_address?.trim() || undefined,
    logoUrl: hasCustomBusinessLogo(settings.logo_url) ? settings.logo_url!.trim() : undefined,
    accent: normalizeAccentColor(settings.accent_color),
    invoiceNumber: invoice.invoice_number,
    issuedDateLabel: formatLongDate(issuedSource.split('T')[0]),
    statusLabel,
    statusTone,
    billToName: client?.name?.trim() || 'Client',
    billToPhone: client?.phone?.trim() || undefined,
    billToEmail: client?.email?.trim() || undefined,
    billToAddress: client?.address?.trim() || undefined,
    serviceDateLabel,
    vehicleLabel,
    locationLabel,
    serviceContextLine: `${vehicleLabel} · ${locationLabel} · ${serviceDateLabel}`,
    lineItems,
    subtotal: lineSubtotal,
    tip: invoice.tip > 0 ? invoice.tip : job.tip,
    discount: discount > 0 ? discount : undefined,
    taxRate: taxRate > 0 ? taxRate : undefined,
    taxAmount: taxAmount > 0 ? taxAmount : undefined,
    poNumber: invoice.po_number?.trim() || undefined,
    total: invoice.total,
    balanceDue: invoice.balance_due,
    showTip: (invoice.tip > 0 ? invoice.tip : job.tip) > 0,
    showDiscount: discount > 0,
    showTax: taxAmount > 0,
    payments: invoice.payments.map((p) => ({
      method: p.method,
      date: p.date,
      amount: p.amount,
    })),
    showPayments: invoice.payments.length > 0,
    termsFooter,
    questionsLine: questionsParts.length > 0 ? `Questions? ${questionsParts.join(' · ')}` : undefined,
    portalUrl: options?.portalUrl,
    isPaid: invoice.status === 'paid' || invoice.balance_due <= 0,
  }
}
