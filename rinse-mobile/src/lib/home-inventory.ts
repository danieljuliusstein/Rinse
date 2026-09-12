import { getSecureItem, setSecureItem } from './secure-storage'
import { getOrganizationId } from './org'

export type InventoryCategory = 'chemicals' | 'equipment' | 'supplies' | 'wishlist'
export type InventoryStatus = 'ok' | 'low'

export interface HomeInventoryItem {
  id: string
  name: string
  category: InventoryCategory
  status?: InventoryStatus
  notes?: string
  priceEstimate?: number
  updatedAt: string
}

const STORAGE_KEY = 'rinse_home_inventory_v1'

function storageKey(): string {
  const orgId = getOrganizationId()
  return orgId ? `${STORAGE_KEY}_${orgId}` : STORAGE_KEY
}

function newId(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function loadHomeInventory(): Promise<HomeInventoryItem[]> {
  try {
    const raw = await getSecureItem(storageKey())
    if (!raw) return []
    return JSON.parse(raw) as HomeInventoryItem[]
  } catch {
    return []
  }
}

export async function saveHomeInventory(items: HomeInventoryItem[]): Promise<void> {
  await setSecureItem(storageKey(), JSON.stringify(items))
}

export function getItemsByCategory(items: HomeInventoryItem[], category: InventoryCategory): HomeInventoryItem[] {
  return items.filter((item) => item.category === category)
}

export function upsertHomeInventoryItem(
  items: HomeInventoryItem[],
  item: Omit<HomeInventoryItem, 'id' | 'updatedAt'> & { id?: string },
): HomeInventoryItem[] {
  const updatedAt = nowIso()
  if (item.id) {
    return items.map((entry) => (entry.id === item.id ? { ...entry, ...item, updatedAt } : entry))
  }
  const created: HomeInventoryItem = {
    ...item,
    id: newId(),
    updatedAt,
  }
  return [...items, created]
}

export function deleteHomeInventoryItem(items: HomeInventoryItem[], id: string): HomeInventoryItem[] {
  return items.filter((item) => item.id !== id)
}
