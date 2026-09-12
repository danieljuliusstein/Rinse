import { isLowStock, weightedAverageCostPerUnit } from '../supplies-logic'
import { loadData, newId, saveData } from '../storage'
import type { RestockInput, Supply, SupplyInput } from '../types'

export function getSupplies(): Supply[] {
  return loadData().supplies
}

export function getSupply(id: string): Supply | null {
  return loadData().supplies.find((s) => s.id === id) ?? null
}

export function getLowInventorySupplies(): Supply[] {
  return getSupplies().filter(isLowStock)
}

export function createSupply(input: SupplyInput): Supply {
  const data = loadData()
  const supply: Supply = { id: newId(), ...input }
  data.supplies.push(supply)
  saveData(data)
  return supply
}

export function updateSupply(id: string, input: Partial<SupplyInput>): Supply | null {
  const data = loadData()
  const idx = data.supplies.findIndex((s) => s.id === id)
  if (idx === -1) return null
  data.supplies[idx] = { ...data.supplies[idx], ...input }
  saveData(data)
  return data.supplies[idx]
}

export function deleteSupply(id: string): boolean {
  const data = loadData()
  const before = data.supplies.length
  data.supplies = data.supplies.filter((s) => s.id !== id)
  if (data.supplies.length === before) return false
  saveData(data)
  return true
}

export function updateSupplyQty(id: string, delta: number): Supply | null {
  const data = loadData()
  const idx = data.supplies.findIndex((s) => s.id === id)
  if (idx === -1) return null
  data.supplies[idx] = {
    ...data.supplies[idx],
    quantity_on_hand: Math.max(0, data.supplies[idx].quantity_on_hand + delta),
  }
  saveData(data)
  return data.supplies[idx]
}

export function restockSupply(id: string, input: RestockInput): Supply | null {
  const data = loadData()
  const idx = data.supplies.findIndex((s) => s.id === id)
  if (idx === -1 || input.quantity <= 0) return null

  const current = data.supplies[idx]
  const updated: Supply = {
    ...current,
    quantity_on_hand: current.quantity_on_hand + input.quantity,
  }

  if (input.total_cost != null && input.total_cost > 0) {
    updated.cost_per_unit = weightedAverageCostPerUnit(
      current.quantity_on_hand,
      current.cost_per_unit,
      input.quantity,
      input.total_cost
    )
  }

  data.supplies[idx] = updated
  saveData(data)
  return updated
}

export function saveSuppliesCatalog(catalog: Supply[]): void {
  const data = loadData()
  data.supplies = catalog
  saveData(data)
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function uploadSupplyPhoto(id: string, file: File): Promise<Supply | null> {
  const dataUrl = await readFileAsDataUrl(file)
  return updateSupply(id, { image_url: dataUrl })
}

export async function clearSupplyPhoto(id: string): Promise<Supply | null> {
  return updateSupply(id, { image_url: undefined })
}
