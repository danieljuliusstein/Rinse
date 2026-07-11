import type { Supply, SupplyInput, RestockInput } from '@rinse/core'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { formatPocketBaseError } from './pocketbase-errors'
import { requireOrganizationId } from './org'
import { requireOrganizationIdForWrite } from './org-write'
import { isLowStock } from './home-dashboard'

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function supplyPhotoUrl(record: Record<string, unknown>): string | undefined {
  const photo = record.photo
  if (!photo || (Array.isArray(photo) && photo.length === 0)) return undefined
  const filename = Array.isArray(photo) ? photo[0] : String(photo)
  return pb().files.getURL(record, filename)
}

function mapSupply(record: Record<string, unknown>): Supply {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    unit: String(record.unit ?? 'unit'),
    quantity_on_hand: Number(record.quantity_on_hand ?? 0),
    reorder_threshold: record.reorder_threshold != null ? Number(record.reorder_threshold) : undefined,
    cost_per_unit: record.cost_per_unit != null ? Number(record.cost_per_unit) : undefined,
    supplier: record.supplier ? String(record.supplier) : undefined,
    kind: record.kind as Supply['kind'],
    notes: record.notes ? String(record.notes) : undefined,
    image_url: supplyPhotoUrl(record),
    icon_key: record.icon_key ? String(record.icon_key) : undefined,
  }
}

function toPb(input: Partial<SupplyInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (input.name !== undefined) out.name = input.name
  if (input.unit !== undefined) out.unit = input.unit
  if (input.quantity_on_hand !== undefined) out.quantity_on_hand = input.quantity_on_hand
  if (input.reorder_threshold !== undefined) out.reorder_threshold = input.reorder_threshold
  if (input.cost_per_unit !== undefined) out.cost_per_unit = input.cost_per_unit
  if (input.supplier !== undefined) out.supplier = input.supplier
  if (input.kind !== undefined) out.kind = input.kind
  if (input.notes !== undefined) out.notes = input.notes
  if (input.icon_key !== undefined) out.icon_key = input.icon_key
  return out
}

export async function listSupplies(): Promise<Supply[]> {
  if (!(await isOnline())) return []
  const orgId = requireOrganizationId()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb().collection('supplies').getFullList({
    filter: `organization_id = "${escaped}"`,
    sort: 'name',
  })
  return records.map((r) => mapSupply(r as Record<string, unknown>))
}

export async function getSupply(id: string): Promise<Supply | null> {
  if (!(await isOnline())) return null
  try {
    const record = await pb().collection('supplies').getOne(id)
    return mapSupply(record as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function listLowInventorySupplies(): Promise<Supply[]> {
  const supplies = await listSupplies()
  return supplies.filter(isLowStock)
}

export async function createSupply(input: SupplyInput): Promise<Supply> {
  const orgId = await requireOrganizationIdForWrite()
  try {
    const record = await pb().collection('supplies').create({
      organization_id: orgId,
      ...toPb(input),
      name: input.name,
      unit: input.unit,
      quantity_on_hand: input.quantity_on_hand,
      kind: input.kind ?? 'other',
    })
    return mapSupply(record as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPocketBaseError(err, 'Could not create supply'))
  }
}

export async function updateSupply(id: string, input: Partial<SupplyInput>): Promise<Supply | null> {
  try {
    const record = await pb().collection('supplies').update(id, toPb(input))
    return mapSupply(record as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function deleteSupply(id: string): Promise<boolean> {
  try {
    await pb().collection('supplies').delete(id)
    return true
  } catch {
    return false
  }
}

export async function restockSupply(id: string, input: RestockInput): Promise<Supply | null> {
  const current = await getSupply(id)
  if (!current) return null
  const qty = input.quantity ?? 0
  const nextQty = current.quantity_on_hand + qty
  let cost = current.cost_per_unit
  if (input.total_cost != null && qty > 0) {
    const priorValue = (current.cost_per_unit ?? 0) * current.quantity_on_hand
    cost = (priorValue + input.total_cost) / nextQty
  }
  return updateSupply(id, {
    quantity_on_hand: nextQty,
    cost_per_unit: cost,
  })
}

export async function adjustSupplyQty(id: string, delta: number): Promise<Supply | null> {
  const current = await getSupply(id)
  if (!current) return null
  return updateSupply(id, { quantity_on_hand: Math.max(0, current.quantity_on_hand + delta) })
}
