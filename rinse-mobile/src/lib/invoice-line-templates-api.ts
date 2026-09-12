import {
  normalizeBillingLine,
  normalizeBillingLines,
  type InvoiceLineTemplate,
} from '@rinse/core'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function mapTemplate(record: Record<string, unknown>): InvoiceLineTemplate {
  return normalizeBillingLine({
    id: String(record.id),
    description: String(record.description ?? ''),
    default_amount: Number(record.default_amount ?? 0),
    quantity: record.quantity != null ? Number(record.quantity) : undefined,
    unit_price: record.unit_price != null ? Number(record.unit_price) : undefined,
    unit: record.unit as InvoiceLineTemplate['unit'],
    category: record.category ? String(record.category) : undefined,
    active: record.active !== false,
  })
}

export async function getInvoiceLineTemplates(): Promise<InvoiceLineTemplate[]> {
  if (!(await isOnline())) return []
  try {
    const orgId = requireOrganizationId()
    const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const records = await pb().collection('invoice_line_templates').getFullList({
      filter: `organization_id = "${escaped}" && active != false`,
      sort: 'description',
    })
    return normalizeBillingLines(records.map((r) => mapTemplate(r as Record<string, unknown>)))
  } catch {
    return []
  }
}

export async function saveInvoiceLineTemplate(
  input: Omit<InvoiceLineTemplate, 'id'> & { id?: string },
): Promise<InvoiceLineTemplate[]> {
  if (!(await isOnline())) throw new Error('You are offline')
  const orgId = requireOrganizationId()
  const line = normalizeBillingLine({ ...input, description: input.description })
  const payload = {
    description: line.description,
    default_amount: line.default_amount,
    quantity: line.quantity,
    unit_price: line.unit_price,
    unit: line.unit ?? 'each',
    category: line.category ?? '',
    active: line.active ?? true,
  }
  if (input.id) {
    await pb().collection('invoice_line_templates').update(input.id, payload)
  } else {
    await pb().collection('invoice_line_templates').create({
      ...payload,
      organization_id: orgId,
    })
  }
  return getInvoiceLineTemplates()
}

export async function deleteInvoiceLineTemplate(id: string): Promise<InvoiceLineTemplate[]> {
  if (!(await isOnline())) throw new Error('You are offline')
  await pb().collection('invoice_line_templates').delete(id)
  return getInvoiceLineTemplates()
}
