import type { Equipment, Supply, SupplyKind } from '@rinse/core'
import type { HomeInventoryItem } from '@/src/lib/home-inventory'
import { isLowStock, isOutOfStock } from '@/src/lib/home-dashboard'

export type SectionKey = 'chemicals' | 'equipment' | 'supplies' | 'wishlist'
export type SupplyFilterChip = 'all' | 'low' | 'out'
export type InventoryRowVariant = '' | 'warning' | 'danger'

export const SUPPLY_FILTER_CHIPS: { id: SupplyFilterChip; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'low', label: 'Low' },
  { id: 'out', label: 'Out' },
]

export const SECTION_CONFIG: {
  key: SectionKey
  title: string
  addLabel: string
  supplyKind?: SupplyKind
  isWishlist?: boolean
  isEquipment?: boolean
}[] = [
  { key: 'chemicals', title: 'Chemicals', addLabel: 'chemical', supplyKind: 'chemical' },
  { key: 'equipment', title: 'Equipment', addLabel: 'equipment', isEquipment: true },
  { key: 'supplies', title: 'Supplies', addLabel: 'supply', supplyKind: 'consumable' },
  { key: 'wishlist', title: 'Wish List', addLabel: 'item', isWishlist: true },
]

export function filterSuppliesByKind(supplies: Supply[], kind: SupplyKind): Supply[] {
  return supplies.filter((supply) => (supply.kind ?? 'other') === kind)
}

export function inventoryRowVariant(supply: Supply): InventoryRowVariant {
  if (isOutOfStock(supply)) return 'danger'
  if (isLowStock(supply)) return 'warning'
  return ''
}

export function groupSupplies(items: Supply[]): { attention: Supply[]; stocked: Supply[] } {
  const attention: Supply[] = []
  const stocked: Supply[] = []
  for (const item of items) {
    if (inventoryRowVariant(item)) attention.push(item)
    else stocked.push(item)
  }
  const byName = (a: Supply, b: Supply) => a.name.localeCompare(b.name)
  attention.sort(byName)
  stocked.sort(byName)
  return { attention, stocked }
}

export function filterBySearch<T extends { name: string }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => item.name.toLowerCase().includes(q))
}

export function filterSuppliesList(items: Supply[], query: string, chip: SupplyFilterChip): Supply[] {
  const searched = filterBySearch(items, query)
  return searched.filter((item) => {
    if (chip === 'low') return isLowStock(item) && !isOutOfStock(item)
    if (chip === 'out') return isOutOfStock(item)
    return true
  })
}

export function supplyMetaLabel(supply: Supply): string {
  if (isOutOfStock(supply)) return 'Out of stock'
  if (isLowStock(supply) && supply.reorder_threshold != null) {
    return `Low stock · reorder at ${supply.reorder_threshold} ${supply.unit}`
  }
  return `${supply.quantity_on_hand} ${supply.unit} on hand`
}

export function supplyQuantityLabel(supply: Supply): string {
  return `${supply.quantity_on_hand} ${supply.unit}`
}

export interface CategoryMeta {
  count: number
  subtitle: string
  metaTone?: 'warning' | 'danger'
}

export function categoryMeta(
  sectionKey: SectionKey,
  catalog: Supply[],
  equipment: Equipment[],
  wishlist: HomeInventoryItem[],
): CategoryMeta {
  if (sectionKey === 'wishlist') {
    const total = wishlist.reduce((sum, item) => sum + (item.priceEstimate ?? 0), 0)
    return {
      count: wishlist.length,
      subtitle: wishlist.length === 0 ? 'No items' : `$${total} total`,
    }
  }

  if (sectionKey === 'equipment') {
    return {
      count: equipment.length,
      subtitle: `${equipment.length} item${equipment.length === 1 ? '' : 's'}`,
    }
  }

  const kind: SupplyKind = sectionKey === 'chemicals' ? 'chemical' : 'consumable'
  const items = filterSuppliesByKind(catalog, kind)
  const outCount = items.filter(isOutOfStock).length
  const lowCount = items.filter((supply) => isLowStock(supply) && !isOutOfStock(supply)).length

  let metaTone: CategoryMeta['metaTone']
  if (outCount > 0) metaTone = 'danger'
  else if (lowCount > 0) metaTone = 'warning'

  const parts: string[] = [`${items.length} item${items.length === 1 ? '' : 's'}`]
  if (outCount > 0) parts.push(`${outCount} out`)
  else if (lowCount > 0) parts.push(`${lowCount} low`)

  return {
    count: items.length,
    subtitle: parts.join(' · '),
    metaTone,
  }
}

export function attentionSupplies(catalog: Supply[]): Supply[] {
  return catalog
    .filter((supply) => inventoryRowVariant(supply))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function sectionForSupply(supply: Supply): SectionKey {
  return supply.kind === 'consumable' ? 'supplies' : 'chemicals'
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
