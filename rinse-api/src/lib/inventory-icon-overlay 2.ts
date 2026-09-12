import { loadData, saveData } from './storage'

function canUseLocalOverlay(): boolean {
  return typeof window !== 'undefined'
}

/** Local fallback when PocketBase has not migrated `icon_key` yet. */
export function loadInventoryIconOverrides(): Record<string, string> {
  if (!canUseLocalOverlay()) return {}
  return loadData().inventory_icon_keys ?? {}
}

export function setInventoryIconOverride(id: string, iconKey: string | undefined): void {
  if (!canUseLocalOverlay()) return
  const data = loadData()
  const next = { ...(data.inventory_icon_keys ?? {}) }
  if (iconKey) next[id] = iconKey
  else delete next[id]
  data.inventory_icon_keys = Object.keys(next).length > 0 ? next : undefined
  saveData(data)
}

export function mergeInventoryIconKeys<T extends { id: string; icon_key?: string }>(items: T[]): T[] {
  const overrides = loadInventoryIconOverrides()
  if (Object.keys(overrides).length === 0) return items

  return items.map((item) => {
    const icon_key = item.icon_key || overrides[item.id] || undefined
    return icon_key === item.icon_key ? item : { ...item, icon_key }
  })
}

export function applyInventoryIconOverride<T extends { id: string; icon_key?: string }>(
  item: T | null,
): T | null {
  if (!item) return null
  const [merged] = mergeInventoryIconKeys([item])
  return merged
}

export function persistInventoryIconKey(id: string, iconKey: string | undefined): void {
  setInventoryIconOverride(id, iconKey || undefined)
}
