import {
  CAR_MAP_PINS,
  type CarMapPin,
} from '@/src/lib/car-map-pins'
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/src/lib/secure-storage'

const STORAGE_KEY = 'rinse.carMapPins.v1'

function isValidPin(value: unknown): value is CarMapPin {
  if (!value || typeof value !== 'object') return false
  const pin = value as CarMapPin
  return (
    typeof pin.id === 'string' &&
    pin.id.length > 0 &&
    typeof pin.left === 'number' &&
    Number.isFinite(pin.left) &&
    typeof pin.top === 'number' &&
    Number.isFinite(pin.top)
  )
}

/** Merge saved coords onto the default pin list (keeps ids/order from defaults). */
export function mergeCarMapPins(saved: CarMapPin[] | null | undefined): CarMapPin[] {
  const byId = new Map((saved ?? []).filter(isValidPin).map((p) => [p.id, p]))
  return CAR_MAP_PINS.map((def) => {
    const hit = byId.get(def.id)
    if (!hit) return { ...def }
    return {
      id: def.id,
      left: Math.min(98, Math.max(2, hit.left)),
      top: Math.min(98, Math.max(2, hit.top)),
    }
  })
}

export async function loadSavedCarMapPins(): Promise<CarMapPin[]> {
  try {
    const raw = await getSecureItem(STORAGE_KEY)
    if (!raw) return CAR_MAP_PINS.map((p) => ({ ...p }))
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return CAR_MAP_PINS.map((p) => ({ ...p }))
    return mergeCarMapPins(parsed as CarMapPin[])
  } catch {
    return CAR_MAP_PINS.map((p) => ({ ...p }))
  }
}

export async function saveCarMapPins(pins: CarMapPin[]): Promise<void> {
  const payload = mergeCarMapPins(pins).map((p) => ({
    id: p.id,
    left: p.left,
    top: p.top,
  }))
  await setSecureItem(STORAGE_KEY, JSON.stringify(payload))
}

export async function clearSavedCarMapPins(): Promise<void> {
  await deleteSecureItem(STORAGE_KEY)
}
