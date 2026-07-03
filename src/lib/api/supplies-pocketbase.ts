import { ensurePocketBaseAuth } from '../pb-auth'
import { getPocketBase } from '../pocketbase'
import { pocketBasePhotoFilename } from '../inventory-photo-url'
import { isLowStock } from '../supplies-logic'
import { appSupplyToPb, pbSupplyToApp, type PbRecord } from './mappers'
import { tenantFilter, withOrganization } from './tenant-pocketbase'
import { weightedAverageCostPerUnit } from '../supplies-logic'
import type { RestockInput, Supply, SupplyInput } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function supplyPhotoUrl(record: PbRecord): string | undefined {
  const filename = pocketBasePhotoFilename(record.photo)
  if (!filename) return undefined
  return pb().files.getURL(record, filename)
}

export async function getSupplies(): Promise<Supply[]> {
  const records = await pb().collection('supplies').getFullList<PbRecord>({ sort: 'name' })
  return records.map((r) => pbSupplyToApp(r, supplyPhotoUrl(r)))
}

export async function getSupply(id: string): Promise<Supply | null> {
  try {
    const record = await pb().collection('supplies').getOne<PbRecord>(id)
    return pbSupplyToApp(record, supplyPhotoUrl(record))
  } catch {
    return null
  }
}

export async function getLowInventorySupplies(): Promise<Supply[]> {
  const supplies = await getSupplies()
  return supplies.filter(isLowStock)
}

export async function createSupply(input: SupplyInput): Promise<Supply> {
  const record = await pb().collection('supplies').create<PbRecord>(
    withOrganization(appSupplyToPb(input)),
  )
  return pbSupplyToApp(record, supplyPhotoUrl(record))
}

export async function updateSupply(id: string, input: Partial<SupplyInput>): Promise<Supply | null> {
  try {
    const current = await getSupply(id)
    if (!current) return null
    const merged = { ...current, ...input }
    try {
      const record = await pb().collection('supplies').update<PbRecord>(id, appSupplyToPb(merged))
      return pbSupplyToApp(record, supplyPhotoUrl(record))
    } catch {
      if (input.icon_key === undefined) return null
      const { icon_key: _iconKey, ...rest } = merged
      const record = await pb().collection('supplies').update<PbRecord>(id, appSupplyToPb(rest))
      return pbSupplyToApp(record, supplyPhotoUrl(record))
    }
  } catch {
    return null
  }
}

export async function uploadSupplyPhoto(id: string, file: File): Promise<Supply | null> {
  try {
    const formData = new FormData()
    formData.append('photo', file)
    const record = await pb().collection('supplies').update<PbRecord>(id, formData)
    return pbSupplyToApp(record, supplyPhotoUrl(record))
  } catch {
    return null
  }
}

export async function clearSupplyPhoto(id: string): Promise<Supply | null> {
  try {
    const record = await pb().collection('supplies').update<PbRecord>(id, { photo: null })
    return pbSupplyToApp(record, undefined)
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

export async function updateSupplyQty(id: string, delta: number): Promise<Supply | null> {
  const current = await getSupply(id)
  if (!current) return null
  return updateSupply(id, {
    quantity_on_hand: Math.max(0, current.quantity_on_hand + delta),
  })
}

export async function restockSupply(id: string, input: RestockInput): Promise<Supply | null> {
  const current = await getSupply(id)
  if (!current || input.quantity <= 0) return null

  const updates: Partial<SupplyInput> = {
    quantity_on_hand: current.quantity_on_hand + input.quantity,
  }

  if (input.total_cost != null && input.total_cost > 0) {
    updates.cost_per_unit = weightedAverageCostPerUnit(
      current.quantity_on_hand,
      current.cost_per_unit,
      input.quantity,
      input.total_cost,
    )
  }

  return updateSupply(id, updates)
}

export async function deductSupplies(suppliesUsed: { supply_id: string; quantity_used: number }[]): Promise<void> {
  for (const usage of suppliesUsed) {
    const supply = await getSupply(usage.supply_id)
    if (!supply) continue
    await updateSupply(usage.supply_id, {
      quantity_on_hand: Math.max(0, supply.quantity_on_hand - usage.quantity_used),
    })
  }
}

/** Convert a data URL from the offline queue into a File for PocketBase upload. */
export async function dataUrlToFile(dataUrl: string, filename = 'product.jpg'): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const type = blob.type || 'image/jpeg'
  return new File([blob], filename, { type })
}

const DEFAULT_SUPPLIES: SupplyInput[] = [
  { name: 'Car wash soap', unit: 'oz', quantity_on_hand: 128, reorder_threshold: 32, cost_per_unit: 0.15, supplier: 'Chemical Guys', kind: 'chemical' },
  { name: 'Microfiber towels', unit: 'each', quantity_on_hand: 24, reorder_threshold: 8, cost_per_unit: 2.5, supplier: 'Amazon', kind: 'consumable' },
  { name: 'Interior cleaner', unit: 'oz', quantity_on_hand: 64, reorder_threshold: 16, cost_per_unit: 0.22, supplier: 'Meguiars', kind: 'chemical' },
  { name: 'Wax / sealant', unit: 'oz', quantity_on_hand: 32, reorder_threshold: 8, cost_per_unit: 1.2, supplier: 'Chemical Guys', kind: 'chemical' },
  { name: 'Ceramic coating', unit: 'oz', quantity_on_hand: 16, reorder_threshold: 4, cost_per_unit: 8.5, supplier: 'Gtechniq', kind: 'chemical' },
]

export async function seedSuppliesIfEmpty(): Promise<number> {
  if (!(await ensurePocketBaseAuth())) return 0

  const client = pb()
  const { totalItems } = await client.collection('supplies').getList(1, 1, { filter: tenantFilter() })
  if (totalItems > 0) return 0

  let created = 0
  for (const item of DEFAULT_SUPPLIES) {
    try {
      await client.collection('supplies').create(withOrganization(appSupplyToPb(item)))
      created++
    } catch {
      break
    }
  }
  return created
}
