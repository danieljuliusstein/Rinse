import type { Invoice } from '@rinse/core'

export type InvoiceDetailSection = 'share' | 'edit'

export type InvoiceDetailPrimaryAction = 'send' | 'remind'

export interface InvoiceDetailPriority {
  guidanceHeading: string
  expandedSection: InvoiceDetailSection | null
  primaryAction: InvoiceDetailPrimaryAction | null
  primaryLabel: string | null
}

export function invoiceDetailPriority(invoice: Invoice): InvoiceDetailPriority {
  switch (invoice.status) {
    case 'draft':
      return {
        guidanceHeading: 'Ready to send — review line items, then share with your client',
        expandedSection: 'edit',
        primaryAction: 'send',
        primaryLabel: 'Send invoice',
      }
    case 'sent':
    case 'partial':
      return {
        guidanceHeading: 'Awaiting payment — send a reminder or share the portal link',
        expandedSection: 'share',
        primaryAction: 'remind',
        primaryLabel: 'Send reminder',
      }
    case 'overdue':
      return {
        guidanceHeading: 'Payment is overdue — follow up with your client',
        expandedSection: 'share',
        primaryAction: 'remind',
        primaryLabel: 'Send reminder',
      }
    case 'paid':
      return {
        guidanceHeading: 'Payment received — invoice settled in full',
        expandedSection: 'share',
        primaryAction: null,
        primaryLabel: null,
      }
    default:
      return {
        guidanceHeading: 'Review invoice details',
        expandedSection: 'share',
        primaryAction: null,
        primaryLabel: null,
      }
  }
}

export function invoiceStatusEyebrow(status: Invoice['status']): string {
  switch (status) {
    case 'paid':
      return 'PAID'
    case 'draft':
      return 'DRAFT'
    case 'overdue':
      return 'OVERDUE'
    case 'partial':
      return 'PARTIAL'
    case 'sent':
    default:
      return 'SENT'
  }
}

export function invoiceStatusTone(status: Invoice['status']): 'green' | 'blue' | 'amber' | 'red' | 'gray' {
  switch (status) {
    case 'paid':
      return 'green'
    case 'overdue':
      return 'red'
    case 'partial':
      return 'amber'
    case 'sent':
      return 'blue'
    case 'draft':
    default:
      return 'gray'
  }
}
