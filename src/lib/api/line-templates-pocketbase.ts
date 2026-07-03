import { getPocketBase, isPocketBaseConfigured } from '../pocketbase'
import { checkPocketBaseHealth } from '../pocketbase'
import { authenticatePocketBase } from '../pb-auth'
import { tenantFilter } from './tenant-pocketbase'
import type { PbRecord } from './mappers'
import type { InvoiceLineTemplate } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

async function canSync(): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false
  if (!(await checkPocketBaseHealth())) return false
  return authenticatePocketBase()
}

function mapTemplate(r: PbRecord): InvoiceLineTemplate {
  return {
    id: String(r.id),
    description: String(r.description ?? ''),
    default_amount: Number(r.default_amount ?? 0),
    category: r.category ? String(r.category) : undefined,
    active: r.active !== false,
  }
}

export async function getInvoiceLineTemplates(): Promise<InvoiceLineTemplate[]> {
  if (!(await canSync())) return []
  const records = await pb().collection('invoice_line_templates').getFullList<PbRecord>({
    filter: `${tenantFilter()} && active != false`,
    sort: 'description',
  })
  return records.map(mapTemplate)
}

export async function saveInvoiceLineTemplate(
  input: Omit<InvoiceLineTemplate, 'id'> & { id?: string }
): Promise<InvoiceLineTemplate[]> {
  if (!(await canSync())) throw new Error('Not connected')
  const payload = {
    description: input.description,
    default_amount: input.default_amount,
    category: input.category ?? '',
    active: input.active ?? true,
  }
  if (input.id) {
    await pb().collection('invoice_line_templates').update(input.id, payload)
  } else {
    const orgId = pb().authStore.record?.organization_id
    await pb().collection('invoice_line_templates').create({
      ...payload,
      organization_id: orgId,
    })
  }
  return getInvoiceLineTemplates()
}

export async function deleteInvoiceLineTemplate(id: string): Promise<InvoiceLineTemplate[]> {
  if (!(await canSync())) throw new Error('Not connected')
  await pb().collection('invoice_line_templates').delete(id)
  return getInvoiceLineTemplates()
}
