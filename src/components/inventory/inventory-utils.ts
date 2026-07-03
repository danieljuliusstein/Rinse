import {
  filterSuppliesByKind,
  filterSuppliesList,
  groupSupplies,
  inventoryRowVariant,
  isLowStock,
  isOutOfStock,
  type SupplyFilterChip,
} from '@/lib/supplies-logic'
import type { HomeInventoryItem } from '@/lib/home-inventory'
import type { Equipment, Supply, SupplyKind } from '@/lib/types'

export type SectionKey = 'chemicals' | 'equipment' | 'supplies' | 'wishlist'
export type { SupplyFilterChip }

export const SUPPLY_FILTER_CHIPS: { id: SupplyFilterChip; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'low', label: 'Low' },
  { id: 'out', label: 'Out' },
  { id: 'not_in_expenses', label: 'Not in expenses' },
]

export const EQUIPMENT_FILTER_CHIPS: { id: SupplyFilterChip; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'not_in_expenses', label: 'Not in expenses' },
]

export { isOutOfStock, inventoryRowVariant, isLowStock, groupSupplies, filterSuppliesList }

export function filterBySearch<T extends { name: string }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => item.name.toLowerCase().includes(q))
}

export function supplyMetaLabel(supply: Supply): string {
  if (isOutOfStock(supply)) return 'Out of stock'
  if (isLowStock(supply) && supply.reorder_threshold != null) {
    return `Low stock · reorder at ${supply.reorder_threshold} ${supply.unit}`
  }
  if (supply.cost_per_unit != null && supply.cost_per_unit > 0) {
    return `${supply.quantity_on_hand} ${supply.unit} on hand`
  }
  return `${supply.quantity_on_hand} ${supply.unit}`
}

export function supplyQuantityLabel(supply: Supply): string {
  return `${supply.quantity_on_hand} ${supply.unit}`
}

export interface CategoryMeta {
  count: number
  subtitle: string
  metaClass?: 'category-grid__meta--warning' | 'category-grid__meta--danger'
}

export function categoryMeta(
  sectionKey: SectionKey,
  catalog: Supply[],
  equipment: Equipment[],
  wishlist: HomeInventoryItem[]
): CategoryMeta {
  if (sectionKey === 'wishlist') {
    const total = wishlist.reduce((sum, i) => sum + (i.priceEstimate ?? 0), 0)
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
  const lowCount = items.filter((s) => isLowStock(s) && !isOutOfStock(s)).length

  let metaClass: CategoryMeta['metaClass']
  if (outCount > 0) metaClass = 'category-grid__meta--danger'
  else if (lowCount > 0) metaClass = 'category-grid__meta--warning'

  const parts: string[] = [`${items.length} item${items.length === 1 ? '' : 's'}`]
  if (outCount > 0) parts.push(`${outCount} out`)
  else if (lowCount > 0) parts.push(`${lowCount} low`)

  return {
    count: items.length,
    subtitle: parts.join(' · '),
    metaClass,
  }
}

export function attentionSupplies(catalog: Supply[]): Supply[] {
  return catalog
    .filter((s) => inventoryRowVariant(s))
    .sort((a, b) => a.name.localeCompare(b.name))
}

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

export function sectionForSupply(supply: Supply): SectionKey {
  return supply.kind === 'consumable' ? 'supplies' : 'chemicals'
}

const SHOW_MORE_LIMIT = 8

export function visibleItems<T>(items: T[], expanded: boolean): { visible: T[]; hiddenCount: number } {
  if (expanded || items.length <= SHOW_MORE_LIMIT) {
    return { visible: items, hiddenCount: 0 }
  }
  return { visible: items.slice(0, SHOW_MORE_LIMIT), hiddenCount: items.length - SHOW_MORE_LIMIT }
}

export { SHOW_MORE_LIMIT }

export type StockBarLevel = 'ok' | 'low' | 'out'

const MONOGRAM_COLORS = ['#1a3a6a', '#3a2a1a', '#2a3a2a', '#3a1a2a', '#2a2a4a']

export function monogramForName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function monogramColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return MONOGRAM_COLORS[Math.abs(hash) % MONOGRAM_COLORS.length]
}

export function stockBarLevel(supply: Supply): StockBarLevel {
  if (isOutOfStock(supply)) return 'out'
  if (isLowStock(supply)) return 'low'
  return 'ok'
}

/** Fill % for stock bar (0–100) */
export function stockBarPercent(supply: Supply): number {
  const onHand = supply.quantity_on_hand
  const reorder = supply.reorder_threshold ?? 0
  const max = Math.max(onHand, reorder * 3, 1)
  return Math.min(100, Math.round((onHand / max) * 100))
}

export function catalogProducts(catalog: Supply[]): Supply[] {
  return [...catalog].sort((a, b) => a.name.localeCompare(b.name))
}

export type CategoryViewMode = 'grid' | 'list'

export function defaultViewMode(_sectionKey: SectionKey): CategoryViewMode {
  return 'list'
}
