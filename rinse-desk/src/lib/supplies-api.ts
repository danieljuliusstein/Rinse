import { getPocketBase } from './pocketbase'
import { orgFilter, requireOrganizationId, formatPbError } from './org'
import { createExpense } from './api'
import { todayISO } from './metrics'
import type { DeskSupply, DeskEquipment } from './types'

function mapSupply(record: Record<string, unknown>): DeskSupply {
  const pb = getPocketBase()
  let image_url: string | undefined = undefined
  const photo = record.photo
  if (photo && !(Array.isArray(photo) && photo.length === 0)) {
    const filename = Array.isArray(photo) ? photo[0] : String(photo)
    image_url = pb.files.getURL(record as any, filename)
  }

  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    unit: String(record.unit ?? 'unit'),
    quantity_on_hand: Number(record.quantity_on_hand ?? 0),
    reorder_threshold: record.reorder_threshold != null ? Number(record.reorder_threshold) : undefined,
    cost_per_unit: record.cost_per_unit != null ? Number(record.cost_per_unit) : undefined,
    supplier: record.supplier ? String(record.supplier) : undefined,
    kind: (record.kind as DeskSupply['kind']) || 'other',
    notes: record.notes ? String(record.notes) : undefined,
    image_url,
    icon_key: record.icon_key ? String(record.icon_key) : undefined,
  }
}

function mapEquipment(record: Record<string, unknown>): DeskEquipment {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    purchase_price: record.purchase_price != null ? Number(record.purchase_price) : undefined,
    purchase_date: record.purchase_date ? String(record.purchase_date).slice(0, 10) : undefined,
    supplier: record.supplier ? String(record.supplier) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
    status: record.status === 'retired' ? 'retired' : 'active',
    icon_key: record.icon_key ? String(record.icon_key) : undefined,
  }
}

export async function listSupplies(): Promise<DeskSupply[]> {
  const pb = getPocketBase()
  try {
    const rows = await pb.collection('supplies').getFullList({
      filter: orgFilter(),
      sort: 'name',
    })
    return rows.map((r) => mapSupply(r as unknown as Record<string, unknown>))
  } catch (err) {
    throw new Error(formatPbError(err, 'Failed to load supplies'))
  }
}

export async function createSupply(input: Omit<DeskSupply, 'id'>): Promise<DeskSupply> {
  const pb = getPocketBase()
  const orgId = requireOrganizationId()
  try {
    const payload: Record<string, unknown> = {
      name: input.name.trim(),
      unit: input.unit.trim() || 'unit',
      quantity_on_hand: Number(input.quantity_on_hand) || 0,
      organization_id: orgId,
    }
    if (input.reorder_threshold !== undefined) payload.reorder_threshold = Number(input.reorder_threshold)
    if (input.cost_per_unit !== undefined) payload.cost_per_unit = Number(input.cost_per_unit)
    if (input.supplier) payload.supplier = input.supplier.trim()
    if (input.kind) payload.kind = input.kind
    if (input.notes) payload.notes = input.notes.trim()
    if (input.icon_key) payload.icon_key = input.icon_key

    const record = await pb.collection('supplies').create(payload)
    return mapSupply(record as unknown as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPbError(err, 'Failed to create supply'))
  }
}

export async function updateSupply(id: string, patch: Partial<DeskSupply>): Promise<DeskSupply> {
  const pb = getPocketBase()
  try {
    const payload: Record<string, unknown> = {}
    if (patch.name !== undefined) payload.name = patch.name.trim()
    if (patch.unit !== undefined) payload.unit = patch.unit.trim()
    if (patch.quantity_on_hand !== undefined) payload.quantity_on_hand = Number(patch.quantity_on_hand)
    if (patch.reorder_threshold !== undefined) payload.reorder_threshold = patch.reorder_threshold
    if (patch.cost_per_unit !== undefined) payload.cost_per_unit = patch.cost_per_unit
    if (patch.supplier !== undefined) payload.supplier = patch.supplier?.trim() || null
    if (patch.kind !== undefined) payload.kind = patch.kind
    if (patch.notes !== undefined) payload.notes = patch.notes?.trim() || null
    if (patch.icon_key !== undefined) payload.icon_key = patch.icon_key

    const record = await pb.collection('supplies').update(id, payload)
    return mapSupply(record as unknown as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPbError(err, 'Failed to update supply'))
  }
}

export async function deleteSupply(id: string): Promise<void> {
  const pb = getPocketBase()
  try {
    await pb.collection('supplies').delete(id)
  } catch (err) {
    throw new Error(formatPbError(err, 'Failed to delete supply'))
  }
}

export async function restockSupply(
  supply: DeskSupply,
  addQuantity: number,
  costPerUnit?: number,
  recordExpense = true,
): Promise<{ supply: DeskSupply; expenseId?: string }> {
  const nextQuantity = Math.max(0, supply.quantity_on_hand + addQuantity)
  const patch: Partial<DeskSupply> = {
    quantity_on_hand: nextQuantity,
  }
  if (costPerUnit !== undefined && costPerUnit > 0) {
    patch.cost_per_unit = costPerUnit
  }

  const updatedSupply = await updateSupply(supply.id, patch)
  let expenseId: string | undefined = undefined

  if (recordExpense && addQuantity > 0) {
    const unitPrice = costPerUnit ?? supply.cost_per_unit ?? 0
    if (unitPrice > 0) {
      try {
        const totalCost = Math.round(unitPrice * addQuantity * 100) / 100
        const exp = await createExpense({
          amount: totalCost,
          description: `Restock: ${supply.name} (${addQuantity} ${supply.unit})`,
          date: todayISO(),
          category: 'supplies',
        })
        expenseId = exp.id
      } catch {
        // non-fatal expense creation
      }
    }
  }

  return { supply: updatedSupply, expenseId }
}

export async function listEquipment(): Promise<DeskEquipment[]> {
  const pb = getPocketBase()
  try {
    const rows = await pb.collection('equipment').getFullList({
      filter: orgFilter(),
      sort: 'name',
    })
    return rows.map((r) => mapEquipment(r as unknown as Record<string, unknown>))
  } catch (err) {
    throw new Error(formatPbError(err, 'Failed to load equipment'))
  }
}

export async function createEquipment(input: Omit<DeskEquipment, 'id'>): Promise<DeskEquipment> {
  const pb = getPocketBase()
  const orgId = requireOrganizationId()
  try {
    const payload: Record<string, unknown> = {
      name: input.name.trim(),
      status: input.status || 'active',
      organization_id: orgId,
    }
    if (input.purchase_price !== undefined) payload.purchase_price = Number(input.purchase_price)
    if (input.purchase_date) payload.purchase_date = input.purchase_date
    if (input.supplier) payload.supplier = input.supplier.trim()
    if (input.notes) payload.notes = input.notes.trim()
    if (input.icon_key) payload.icon_key = input.icon_key

    const record = await pb.collection('equipment').create(payload)
    return mapEquipment(record as unknown as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPbError(err, 'Failed to create equipment'))
  }
}

export async function updateEquipment(id: string, patch: Partial<DeskEquipment>): Promise<DeskEquipment> {
  const pb = getPocketBase()
  try {
    const payload: Record<string, unknown> = {}
    if (patch.name !== undefined) payload.name = patch.name.trim()
    if (patch.status !== undefined) payload.status = patch.status
    if (patch.purchase_price !== undefined) payload.purchase_price = patch.purchase_price
    if (patch.purchase_date !== undefined) payload.purchase_date = patch.purchase_date
    if (patch.supplier !== undefined) payload.supplier = patch.supplier?.trim() || null
    if (patch.notes !== undefined) payload.notes = patch.notes?.trim() || null
    if (patch.icon_key !== undefined) payload.icon_key = patch.icon_key

    const record = await pb.collection('equipment').update(id, payload)
    return mapEquipment(record as unknown as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPbError(err, 'Failed to update equipment'))
  }
}

export async function deleteEquipment(id: string): Promise<void> {
  const pb = getPocketBase()
  try {
    await pb.collection('equipment').delete(id)
  } catch (err) {
    throw new Error(formatPbError(err, 'Failed to delete equipment'))
  }
}
