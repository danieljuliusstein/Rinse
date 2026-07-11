import type { AppSettings } from './settings-store'

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

export const INVOICE_ACCENT_PRESETS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#0ea5e9'] as const
