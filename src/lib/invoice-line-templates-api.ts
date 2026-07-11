import type { InvoiceLineTemplate } from '@rinse/core'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function mapTemplate(record: Record<string, unknown>): InvoiceLineTemplate {
  return {
    id: String(record.id),
    description: String(record.description ?? ''),
    default_amount: Number(record.default_amount ?? 0),
    category: record.category ? String(record.category) : undefined,
    active: record.active !== false,
  }
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
    return records.map((r) => mapTemplate(r as Record<string, unknown>))
  } catch {
    return []
  }
}

export async function saveInvoiceLineTemplate(
  input: Omit<InvoiceLineTemplate, 'id'> & { id?: string },
): Promise<InvoiceLineTemplate[]> {
  if (!(await isOnline())) throw new Error('You are offline')
  const orgId = requireOrganizationId()
  const payload = {
    description: input.description,
    default_amount: input.default_amount,
    category: input.category ?? '',
    active: input.active ?? true,
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
