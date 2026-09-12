/**
 * Google Places Autocomplete (New) with cost guards:
 * - session tokens (one billed session per accepted suggestion)
 * - US-only + address primary types
 * - soft daily selection cap (50) → Nominatim after that
 */

import type { GeocodeHit } from '@/lib/route-api'

const DAILY_SELECTION_CAP = 50
const STORAGE_PREFIX = 'desk_places_selections_'

export type PlaceSuggestion = {
  placeId: string
  description: string
  toPlace: () => google.maps.places.Place
}

function todayKey(): string {
  return `${STORAGE_PREFIX}${new Date().toISOString().slice(0, 10)}`
}

export function getGoogleMapsApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || ''
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(getGoogleMapsApiKey())
}

export function getPlacesSelectionsToday(): number {
  try {
    const raw = localStorage.getItem(todayKey())
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function placesDailyCapRemaining(): number {
  return Math.max(0, DAILY_SELECTION_CAP - getPlacesSelectionsToday())
}

export function isPlacesDailyCapReached(): boolean {
  return placesDailyCapRemaining() <= 0
}

function recordPlaceSelection(): void {
  try {
    localStorage.setItem(todayKey(), String(getPlacesSelectionsToday() + 1))
  } catch {
    /* private mode */
  }
}

export function getPlacesDailyCap(): number {
  return DAILY_SELECTION_CAP
}

let loadPromise: Promise<google.maps.PlacesLibrary> | null = null

/** Load Maps JS once; places via importLibrary (avoids loading unused map widgets). */
export async function loadPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  if (!isGooglePlacesConfigured()) {
    throw new Error('VITE_GOOGLE_MAPS_API_KEY is not set')
  }
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    await ensureMapsScript(getGoogleMapsApiKey())
    return (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary
  })()

  try {
    return await loadPromise
  } catch (err) {
    loadPromise = null
    throw err
  }
}

function ensureMapsScript(apiKey: string): Promise<void> {
  const mapsReady = () =>
    typeof google !== 'undefined' && typeof google.maps?.importLibrary === 'function'

  if (mapsReady()) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-desk-google-maps]')
    if (existing) {
      const started = Date.now()
      const poll = window.setInterval(() => {
        if (mapsReady()) {
          window.clearInterval(poll)
          resolve()
        } else if (Date.now() - started > 15_000) {
          window.clearInterval(poll)
          reject(new Error('Google Maps load timed out'))
        }
      }, 40)
      return
    }

    const w = window as unknown as { __deskGmInit?: () => void }
    w.__deskGmInit = () => {
      resolve()
    }

    const script = document.createElement('script')
    script.dataset.deskGoogleMaps = '1'
    script.async = true
    // loading=async + importLibrary — do not add libraries= in the URL
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async&callback=__deskGmInit`
    script.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })
}

export type SuggestPlacesOptions = {
  sessionToken: google.maps.places.AutocompleteSessionToken
  near?: { lat: number; lng: number } | null
  input: string
  signal?: AbortSignal
}

export async function fetchPlaceSuggestions(
  opts: SuggestPlacesOptions,
): Promise<PlaceSuggestion[]> {
  if (isPlacesDailyCapReached()) return []

  const { AutocompleteSuggestion } = await loadPlacesLibrary()
  if (opts.signal?.aborted) return []

  const request: google.maps.places.AutocompleteRequest = {
    input: opts.input,
    sessionToken: opts.sessionToken,
    includedRegionCodes: ['us'],
    includedPrimaryTypes: ['street_address', 'premise', 'subpremise', 'route'],
    language: 'en-US',
    region: 'us',
  }

  if (opts.near && Number.isFinite(opts.near.lat) && Number.isFinite(opts.near.lng)) {
    request.locationBias = {
      center: { lat: opts.near.lat, lng: opts.near.lng },
      radius: 40_000,
    }
  }

  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
  if (opts.signal?.aborted) return []

  const out: PlaceSuggestion[] = []
  for (const s of suggestions) {
    const pred = s.placePrediction
    if (!pred) continue
    out.push({
      placeId: pred.placeId,
      description: pred.text.toString(),
      toPlace: () => pred.toPlace(),
    })
  }
  return out
}

export type ResolvedPlace = GeocodeHit & {
  street?: string
  city?: string
  state?: string
  zip?: string
}

/** Resolve prediction with a tight field mask — completes the autocomplete billing session. */
export async function resolvePlaceSuggestion(
  suggestion: PlaceSuggestion,
): Promise<ResolvedPlace> {
  const place = suggestion.toPlace()
  await place.fetchFields({
    fields: ['formattedAddress', 'location', 'addressComponents'],
  })
  recordPlaceSelection()

  const lat = place.location?.lat()
  const lng = place.location?.lng()
  if (lat == null || lng == null) {
    throw new Error('Place has no coordinates')
  }

  const components = place.addressComponents ?? []
  const textOf = (c: (typeof components)[number], short: boolean) => {
    const any = c as {
      longText?: string
      shortText?: string
      longName?: string
      shortName?: string
      long_name?: string
      short_name?: string
    }
    if (short) {
      return any.shortText || any.shortName || any.short_name || undefined
    }
    return any.longText || any.longName || any.long_name || undefined
  }
  const getLong = (...types: string[]) => {
    const c = components.find((x) => types.some((t) => x.types.includes(t)))
    return c ? textOf(c, false) : undefined
  }
  const getShort = (...types: string[]) => {
    const c = components.find((x) => types.some((t) => x.types.includes(t)))
    return c ? textOf(c, true) : undefined
  }

  const streetNumber = getLong('street_number')
  const route = getLong('route')
  const street = [streetNumber, route].filter(Boolean).join(' ') || undefined
  const city =
    getLong('locality') ||
    getLong('postal_town') ||
    getLong('sublocality', 'sublocality_level_1') ||
    getLong('neighborhood') ||
    getLong('administrative_area_level_3') ||
    getLong('administrative_area_level_2') ||
    undefined
  const state = getShort('administrative_area_level_1') || undefined
  const zip = getLong('postal_code') || undefined

  return {
    lat,
    lng,
    display_name: place.formattedAddress || suggestion.description,
    quality: 'house' as const,
    street,
    city,
    state,
    zip,
  }
}

export async function createAutocompleteSessionToken(): Promise<google.maps.places.AutocompleteSessionToken> {
  const { AutocompleteSessionToken } = await loadPlacesLibrary()
  return new AutocompleteSessionToken()
}
