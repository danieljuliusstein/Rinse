/** Desk → Detailing apps/api helpers for geocode + OSRM trip. */

function appApiBase(): string {
  const raw = import.meta.env.VITE_APP_API_URL?.trim()
  if (!raw) return ''
  return raw.replace(/\/$/, '')
}

export function isRouteApiConfigured(): boolean {
  return Boolean(appApiBase())
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const base = appApiBase()
  if (!base) throw new Error('VITE_APP_API_URL is not set')
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export type GeocodeResult = { lat: number; lng: number }

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  return postJson<GeocodeResult>('/api/geocode', { address })
}

export type TripStop = { id: string; lat: number; lng: number }

export type TripOptimizeResult = {
  orderedIds: string[]
  duration_minutes?: number
  distance_meters?: number
}

export async function optimizeRouteTrip(
  stops: TripStop[],
  depot?: { lat: number; lng: number } | null,
): Promise<TripOptimizeResult> {
  return postJson<TripOptimizeResult>('/api/route-trip', {
    stops,
    depot: depot ?? null,
  })
}
