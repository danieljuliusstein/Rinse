/**
 * Nominatim geocode (shared with drive-time). No API key.
 * Callers should cache results — Nominatim has strict rate limits.
 *
 * Prefers street/building hits in the US; rejects city/county centroids when the
 * query looks like a street address. Optional `context` (e.g. business address)
 * fills in missing city/state so "123 Main St" resolves locally, not across the US.
 */

export type GeocodeHit = {
  lat: number
  lng: number
  /** Nominatim display_name — use as suggested corrected address. */
  display_name: string
  /** Rough quality for UI warnings. */
  quality: 'house' | 'poi' | 'street' | 'area' | 'unknown'
}

export type GeocodeResult = GeocodeHit

export type GeocodeOptions = {
  /** Business / depot address — appended when the query lacks city/state. */
  context?: string
  /** Prefer results near this point (viewbox), e.g. depot lat/lng. */
  near?: { lat: number; lng: number }
  limit?: number
}

type NominatimRow = {
  lon?: string
  lat?: string
  display_name?: string
  class?: string
  type?: string
  importance?: number
}

const AREA_TYPES = new Set([
  'administrative',
  'city',
  'town',
  'village',
  'municipality',
  'county',
  'state',
  'country',
  'postcode',
  'continent',
  'island',
  'archipelago',
  'suburb',
  'neighbourhood',
  'neighborhood',
  'quarter',
  'borough',
])

function looksLikeStreetAddress(q: string): boolean {
  // Leading street number, or common street suffix without being only a city name.
  if (/^\s*\d/.test(q)) return true
  return /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|way|ct|court|pl|place|pkwy|parkway|cir|circle|trl|trail|hwy|highway)\b/i.test(
    q,
  )
}

function hasCityOrState(q: string): boolean {
  if (/\b\d{5}(-\d{4})?\b/.test(q)) return true
  // US state abbreviation after a comma/space (not mid-street like "NE")
  if (/,\s*[A-Za-z]{2}\s*(,|$|\d)/.test(q)) return true
  if (/,\s*[A-Za-z .]+,\s*[A-Za-z]{2}\b/.test(q)) return true
  return /,/.test(q) && /\b(georgia|alabama|florida|tennessee|north carolina|south carolina)\b/i.test(q)
}

/** Pull a short "City, ST" (or leftover after first comma) from a fuller address. */
export function contextLocality(context: string): string {
  const c = context.trim()
  if (!c) return ''
  // Prefer "City, ST ZIP" tail
  const m = c.match(/([A-Za-z .'-]+,\s*[A-Z]{2}(?:\s+\d{5}(?:-\d{4})?)?)\s*$/)
  if (m?.[1]) return m[1].replace(/\s+\d{5}(?:-\d{4})?$/, '').trim()
  // Or everything after the first comma
  const i = c.indexOf(',')
  if (i >= 0 && i < c.length - 1) return c.slice(i + 1).trim()
  return c
}

function enrichQuery(address: string, context?: string): string {
  const q = address.trim()
  if (!q || !context?.trim()) return q
  if (hasCityOrState(q)) return q
  const locality = contextLocality(context)
  if (!locality) return q
  const lower = q.toLowerCase()
  if (locality.split(',')[0] && lower.includes(locality.split(',')[0]!.trim().toLowerCase())) {
    return q
  }
  return `${q}, ${locality}`
}

function qualityOf(row: NominatimRow): GeocodeHit['quality'] {
  const cls = String(row.class ?? '')
  const typ = String(row.type ?? '')
  if (cls === 'place' && typ === 'house') return 'house'
  if (cls === 'building') return 'house'
  if (['amenity', 'shop', 'office', 'tourism', 'leisure', 'craft'].includes(cls)) return 'poi'
  if (cls === 'highway' || cls === 'landuse') return 'street'
  if (cls === 'boundary' || (cls === 'place' && AREA_TYPES.has(typ))) return 'area'
  return 'unknown'
}

function scoreRow(row: NominatimRow, streetQuery: boolean): number {
  const cls = String(row.class ?? '')
  const typ = String(row.type ?? '')
  const q = qualityOf(row)
  if (q === 'area') {
    // Never use city centroids for street-like queries.
    if (streetQuery) return -1000
    return 5
  }
  let score = 20
  if (q === 'house') score = 100
  else if (q === 'poi') score = 85
  else if (q === 'street') score = 55
  else score = 30
  if (cls === 'highway' && typ === 'residential') score += 5
  const importance = Number(row.importance ?? 0)
  if (Number.isFinite(importance)) score += importance * 10
  return score
}

function parseHit(row: NominatimRow | undefined, streetQuery: boolean): GeocodeHit | null {
  if (!row?.lon || !row?.lat) return null
  if (streetQuery && scoreRow(row, true) < 0) return null
  const lng = Number(row.lon)
  const lat = Number(row.lat)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  const display_name = String(row.display_name ?? '').trim()
  if (!display_name) return null
  return { lat, lng, display_name, quality: qualityOf(row) }
}

async function nominatimSearch(q: string, limit: number, near?: { lat: number; lng: number }) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'us')
  if (near && Number.isFinite(near.lat) && Number.isFinite(near.lng)) {
    const d = 0.45 // ~30–35 mi box
    const left = near.lng - d
    const right = near.lng + d
    const top = near.lat + d
    const bottom = near.lat - d
    url.searchParams.set('viewbox', `${left},${top},${right},${bottom}`)
    url.searchParams.set('bounded', '0') // prefer, don't force
  }
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'RinseDetailing/1.0 (geocode; contact@rinsehq.com)',
    },
    cache: 'no-store',
  })
  if (!res.ok) return [] as NominatimRow[]
  const data = (await res.json()) as NominatimRow[]
  return Array.isArray(data) ? data : []
}

export async function suggestAddresses(
  address: string,
  options: GeocodeOptions | number = {},
): Promise<GeocodeHit[]> {
  // Back-compat: suggestAddresses(q, limit)
  const opts: GeocodeOptions = typeof options === 'number' ? { limit: options } : options
  const raw = address.trim()
  if (!raw) return []
  const q = enrichQuery(raw, opts.context)
  const streetQuery = looksLikeStreetAddress(raw) || looksLikeStreetAddress(q)
  const capped = Math.max(1, Math.min(opts.limit ?? 5, 8))
  // Over-fetch so we can filter city centroids and still fill the list.
  const rows = await nominatimSearch(q, Math.min(capped + 4, 12), opts.near)

  const ranked = rows
    .map((row) => ({ row, score: scoreRow(row, streetQuery) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)

  const out: GeocodeHit[] = []
  const seen = new Set<string>()
  for (const { row } of ranked) {
    const hit = parseHit(row, streetQuery)
    if (!hit) continue
    const key = `${hit.lat.toFixed(5)},${hit.lng.toFixed(5)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(hit)
    if (out.length >= capped) break
  }

  // If enrichment produced nothing, try the raw query once (still US-biased).
  if (out.length === 0 && q !== raw) {
    return suggestAddresses(raw, { ...opts, context: undefined })
  }
  return out
}

export async function geocodeAddress(
  address: string,
  options: GeocodeOptions = {},
): Promise<GeocodeResult | null> {
  const hits = await suggestAddresses(address, { ...options, limit: options.limit ?? 5 })
  // Prefer first non-area hit
  return hits.find((h) => h.quality !== 'area') ?? hits[0] ?? null
}
