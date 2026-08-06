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

export type GeocodeQuality = 'house' | 'poi' | 'street' | 'area' | 'unknown'

export type GeocodeHit = {
  lat: number
  lng: number
  display_name: string
  quality?: GeocodeQuality
}

export type GeocodeResult = GeocodeHit

export type GeocodeSuggestResult = GeocodeHit & {
  suggestions: GeocodeHit[]
}

export type GeocodeRequestOptions = {
  /** Business / depot address — fills missing city/state on short client addresses. */
  context?: string
  near?: { lat: number; lng: number } | null
  limit?: number
}

export async function geocodeAddress(
  address: string,
  options: GeocodeRequestOptions = {},
): Promise<GeocodeResult> {
  return postJson<GeocodeResult>('/api/geocode', {
    address,
    context: options.context || undefined,
    near: options.near ?? undefined,
  })
}

export async function suggestAddress(
  address: string,
  options: GeocodeRequestOptions | number = {},
): Promise<GeocodeSuggestResult> {
  const opts: GeocodeRequestOptions = typeof options === 'number' ? { limit: options } : options
  return postJson<GeocodeSuggestResult>('/api/geocode', {
    address,
    suggest: true,
    limit: opts.limit ?? 5,
    context: opts.context || undefined,
    near: opts.near ?? undefined,
  })
}

/** Loose compare so punctuation/case differences don't re-prompt. */
export function addressesLookSame(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[.,#]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\bunited states of america\b/g, 'usa')
      .replace(/\bunited states\b/g, 'usa')
      .trim()
  return norm(a) === norm(b)
}

export type TripStop = { id: string; lat: number; lng: number }

export type TripOptimizeResult = {
  orderedIds: string[]
  /** Road-following LineString [lng, lat][] from OSRM trip (geometries=geojson). */
  geometry?: Array<[number, number]>
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
