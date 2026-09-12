import { purgeStaleQueueItems } from './api/queue-utils'
import { clearQueue } from './offline-queue'
import { isDemoAppData, isDemoHomeInventory } from './demo-data'
import type { HomeInventoryItem } from './home-inventory'
import { createEmptyData, saveData } from './storage'
import { isPocketBaseConfigured } from './pocketbase'
import { getCurrentOrganizationId, scopedStorageKey } from './tenant'

const APP_DATA_KEY = 'detailing_app_data_v1'
const HOME_INVENTORY_KEY = 'detailing_home_inventory_v1'
const ID_MAP_KEY = 'detailing_pb_id_map_v1'
const MIGRATED_KEY = 'migrated_to_pb_v1'
const CATALOG_OK_KEY = 'pb_catalog_ready_v1'

function removeKeyVariants(base: string): void {
  localStorage.removeItem(base)
  const orgId = getCurrentOrganizationId()
  if (orgId) localStorage.removeItem(`${base}_${orgId}`)
  localStorage.removeItem(scopedStorageKey(base))
}

/** Wipe per-device caches (jobs, clients, inventory). Keeps local settings preferences. */
export async function clearLocalDeviceData(): Promise<void> {
  if (typeof window === 'undefined') return

  removeKeyVariants(APP_DATA_KEY)
  removeKeyVariants(HOME_INVENTORY_KEY)
  removeKeyVariants(ID_MAP_KEY)
  removeKeyVariants(MIGRATED_KEY)
  removeKeyVariants(CATALOG_OK_KEY)
  saveData(createEmptyData())
  await clearQueue()
}

export async function clearLocalDeviceDataSync(): Promise<void> {
  await clearLocalDeviceData()
  await purgeStaleQueueItems()
}

/** Remove saved demo if present — e.g. phone that seeded before cloud connected. */
export function purgeDemoCacheIfPresent(): boolean {
  if (typeof window === 'undefined') return false
  let purged = false

  const rawApp = localStorage.getItem(scopedStorageKey(APP_DATA_KEY)) ?? localStorage.getItem(APP_DATA_KEY)
  if (rawApp) {
    try {
      const parsed = JSON.parse(rawApp)
      if (!isPocketBaseConfigured() || isDemoAppData(parsed)) {
        localStorage.removeItem(scopedStorageKey(APP_DATA_KEY))
        localStorage.removeItem(APP_DATA_KEY)
        purged = true
      }
    } catch {
      localStorage.removeItem(APP_DATA_KEY)
      purged = true
    }
  }

  const rawInv = localStorage.getItem(scopedStorageKey(HOME_INVENTORY_KEY)) ?? localStorage.getItem(HOME_INVENTORY_KEY)
  if (rawInv) {
    try {
      const items = JSON.parse(rawInv) as HomeInventoryItem[]
      if (!isPocketBaseConfigured() || isDemoHomeInventory(items)) {
        localStorage.removeItem(scopedStorageKey(HOME_INVENTORY_KEY))
        localStorage.removeItem(HOME_INVENTORY_KEY)
        purged = true
      }
    } catch {
      localStorage.removeItem(HOME_INVENTORY_KEY)
      purged = true
    }
  }

  if (purged) {
    void clearQueue()
  }

  return purged
}
