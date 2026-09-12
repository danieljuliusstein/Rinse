import type { Equipment, EquipmentInput } from '@rinse/core'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { formatPocketBaseError } from './pocketbase-errors'
import { requireOrganizationId } from './org'
import { requireOrganizationIdForWrite } from './org-write'

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function equipmentPhotoUrl(record: Record<string, unknown>): string | undefined {
  const photo = record.photo
  if (!photo || (Array.isArray(photo) && photo.length === 0)) return undefined
  const filename = Array.isArray(photo) ? photo[0] : String(photo)
  return pb().files.getURL(record, filename)
}

function mapEquipment(record: Record<string, unknown>): Equipment {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    purchase_price: record.purchase_price != null ? Number(record.purchase_price) : undefined,
    purchase_date: record.purchase_date ? String(record.purchase_date) : undefined,
    supplier: record.supplier ? String(record.supplier) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
    status: record.status as Equipment['status'],
    image_url: equipmentPhotoUrl(record),
    icon_key: record.icon_key ? String(record.icon_key) : undefined,
  }
}

function toPb(input: Partial<EquipmentInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (input.name !== undefined) out.name = input.name
  if (input.purchase_price !== undefined) out.purchase_price = input.purchase_price
  if (input.purchase_date !== undefined) out.purchase_date = input.purchase_date
  if (input.supplier !== undefined) out.supplier = input.supplier
  if (input.notes !== undefined) out.notes = input.notes
  if (input.status !== undefined) out.status = input.status
  if (input.icon_key !== undefined) out.icon_key = input.icon_key
  return out
}

export async function listEquipment(): Promise<Equipment[]> {
  if (!(await isOnline())) return []
  const orgId = requireOrganizationId()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb().collection('equipment').getFullList({
    filter: `organization_id = "${escaped}"`,
    sort: 'name',
  })
  return records.map((r) => mapEquipment(r as Record<string, unknown>))
}

export async function getEquipmentItem(id: string): Promise<Equipment | null> {
  if (!(await isOnline())) return null
  try {
    const record = await pb().collection('equipment').getOne(id)
    return mapEquipment(record as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function createEquipment(input: EquipmentInput): Promise<Equipment> {
  const orgId = await requireOrganizationIdForWrite()
  try {
    const record = await pb().collection('equipment').create({
      organization_id: orgId,
      ...toPb(input),
      name: input.name,
      status: input.status ?? 'active',
      ...(input.purchase_date ? { purchase_date: input.purchase_date } : {}),
    })
    return mapEquipment(record as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPocketBaseError(err, 'Could not create equipment'))
  }
}

export async function updateEquipment(id: string, input: Partial<EquipmentInput>): Promise<Equipment | null> {
  try {
    const record = await pb().collection('equipment').update(id, toPb(input))
    return mapEquipment(record as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    await pb().collection('equipment').delete(id)
    return true
  } catch {
    return false
  }
}
