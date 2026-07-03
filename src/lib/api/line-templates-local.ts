import { loadData, newId, saveData } from '../storage'
import type { InvoiceLineTemplate } from '../types'

export function getInvoiceLineTemplates(): InvoiceLineTemplate[] {
  const data = loadData()
  const templates = (data as { invoice_line_templates?: InvoiceLineTemplate[] }).invoice_line_templates ?? []
  return templates.filter((t) => t.active !== false)
}

export function saveInvoiceLineTemplate(
  input: Omit<InvoiceLineTemplate, 'id'> & { id?: string }
): InvoiceLineTemplate[] {
  const data = loadData() as { invoice_line_templates?: InvoiceLineTemplate[] }
  const list = data.invoice_line_templates ?? []
  const template: InvoiceLineTemplate = {
    id: input.id ?? newId(),
    description: input.description,
    default_amount: input.default_amount,
    category: input.category,
    active: input.active ?? true,
  }
  const idx = list.findIndex((t) => t.id === template.id)
  if (idx >= 0) list[idx] = template
  else list.push(template)
  data.invoice_line_templates = list
  saveData(data as ReturnType<typeof loadData>)
  return getInvoiceLineTemplates()
}

export function deleteInvoiceLineTemplate(id: string): InvoiceLineTemplate[] {
  const data = loadData() as { invoice_line_templates?: InvoiceLineTemplate[] }
  data.invoice_line_templates = (data.invoice_line_templates ?? []).filter((t) => t.id !== id)
  saveData(data as ReturnType<typeof loadData>)
  return getInvoiceLineTemplates()
}
