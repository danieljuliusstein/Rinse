import type { AppSettings } from './settings'

export type InvoiceTemplateId = NonNullable<AppSettings['invoice_template']>

export const INVOICE_TEMPLATES: {
  id: InvoiceTemplateId
  label: string
  description: string
}[] = [
  { id: 'rinse', label: 'Rinse', description: 'Dark header, bold line items' },
  { id: 'classic', label: 'Classic', description: 'Serif business name' },
  { id: 'minimal', label: 'Minimal', description: 'Airy uppercase labels' },
]
