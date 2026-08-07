import {
  geocodeAddress,
  isRouteApiConfigured,
  type GeocodeHit,
} from '@/lib/route-api'

/**
 * One-shot geocode for contact save. Skips live autocomplete traffic —
 * call only when persisting an address without an existing pin.
 */
export async function geocodeAddressOnce(
  address: string,
  opts?: { context?: string },
): Promise<GeocodeHit | null> {
  const trimmed = address.trim()
  if (!trimmed) return null
  if (!isRouteApiConfigured()) return null
  try {
    const hit = await geocodeAddress(trimmed, { context: opts?.context })
    if (hit.quality === 'area') return null
    return hit
  } catch {
    return null
  }
}
