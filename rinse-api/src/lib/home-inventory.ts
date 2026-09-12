import { isDemoHomeInventory } from './demo-data'
import { isPocketBaseConfigured } from './pocketbase'
import { scopedStorageKey } from './tenant'

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

const STORAGE_KEY = 'detailing_home_inventory_v1'

function newId(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export function createSeedInventory(): HomeInventoryItem[] {
  const t = nowIso()
  return [
    { id: 'hi_13', name: 'Foam cannon', category: 'wishlist', priceEstimate: 120, updatedAt: t },
    { id: 'hi_14', name: 'Extractors', category: 'wishlist', priceEstimate: 290, updatedAt: t },
  ]
}

export function loadHomeInventory(): HomeInventoryItem[] {
  if (typeof window === 'undefined') return []

  const useDevSeed = process.env.NODE_ENV === 'development' && !isPocketBaseConfigured()
  const raw = localStorage.getItem(scopedStorageKey(STORAGE_KEY))

  if (!raw) {
    if (useDevSeed) {
      const seed = createSeedInventory()
      localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(seed))
      return seed
    }
    return []
  }

  try {
    const items = JSON.parse(raw) as HomeInventoryItem[]
    if (isPocketBaseConfigured() && isDemoHomeInventory(items)) {
      localStorage.removeItem(scopedStorageKey(STORAGE_KEY))
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
    return items
  } catch {
    localStorage.removeItem(scopedStorageKey(STORAGE_KEY))
    localStorage.removeItem(STORAGE_KEY)
    return useDevSeed ? createSeedInventory() : []
  }
}

export function saveHomeInventory(items: HomeInventoryItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(items))
}

export function getItemsByCategory(items: HomeInventoryItem[], category: InventoryCategory): HomeInventoryItem[] {
  return items.filter((i) => i.category === category)
}

export function countLowItems(items: HomeInventoryItem[]): number {
  return items.filter((i) => i.status === 'low').length
}

export function upsertHomeInventoryItem(
  items: HomeInventoryItem[],
  item: Omit<HomeInventoryItem, 'id' | 'updatedAt'> & { id?: string }
): HomeInventoryItem[] {
  const updatedAt = nowIso()
  if (item.id) {
    return items.map((i) => (i.id === item.id ? { ...i, ...item, updatedAt } : i))
  }
  const created: HomeInventoryItem = {
    ...item,
    id: newId(),
    updatedAt,
  }
  return [...items, created]
}

export function deleteHomeInventoryItem(items: HomeInventoryItem[], id: string): HomeInventoryItem[] {
  return items.filter((i) => i.id !== id)
}

export function formatUpdatedDate(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    if (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    ) {
      return 'today'
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

export function categoryLabel(category: InventoryCategory): string {
  const labels: Record<InventoryCategory, string> = {
    chemicals: 'Chemicals',
    equipment: 'Equipment',
    supplies: 'Supplies',
    wishlist: 'Wish List',
  }
  return labels[category]
}
