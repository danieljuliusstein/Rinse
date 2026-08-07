import { useEffect, useId, useRef, useState } from 'react'
import {
  composeManualAddress,
  isManualAddressSufficient,
  isManualPartsSufficient,
  manualAddressHint,
  parseManualAddress,
  type ManualAddressParts,
} from '@/lib/address-utils'
import {
  createAutocompleteSessionToken,
  fetchPlaceSuggestions,
  isGooglePlacesConfigured,
  isPlacesDailyCapReached,
  resolvePlaceSuggestion,
  type PlaceSuggestion,
} from '@/lib/google-places'
import {
  isRouteApiConfigured,
  suggestAddress,
  type GeocodeHit,
} from '@/lib/route-api'

type Props = {
  value: string
  onChange: (next: string) => void
  /** Called when user picks a validated suggestion (coords + display name). */
  onPickSuggestion?: (hit: GeocodeHit) => void
  /** Business address — biases Nominatim short queries. */
  context?: string
  near?: { lat: number; lng: number } | null
  className?: string
  placeholder?: string
  'aria-label'?: string
  disabled?: boolean
  /**
   * When true, empty address is allowed; non-empty address must include
   * city+state or ZIP unless a suggestion was picked.
   */
  requireStructuredManual?: boolean
  /** Compact UI (table cells / calendar). Same fields, tighter spacing. */
  compact?: boolean
  /** Pre-existing map pin (edit contact already has lat/lng). */
  initiallyPinned?: boolean
}

const DEBOUNCE_MS = 320
const MIN_CHARS = 3

/**
 * Checkout-style address entry: street · city · ST · ZIP always visible.
 * Autocomplete attaches to the street field only (no mode toggle).
 * Full geocode still happens on save when no suggestion was picked.
 */
export default function AddressAutocompleteInput({
  value,
  onChange,
  onPickSuggestion,
  context,
  near,
  className,
  placeholder = 'Street address',
  disabled,
  'aria-label': ariaLabel,
  requireStructuredManual = true,
  compact = false,
  initiallyPinned = false,
}: Props) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const streetWrapRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Array<GeocodeHit | PlaceSuggestion>>([])
  const [error, setError] = useState<string | null>(null)
  const [parts, setParts] = useState<ManualAddressParts>(() => parseManualAddress(value))
  const [pinned, setPinned] = useState(initiallyPinned)
  const [provider, setProvider] = useState<'google' | 'nominatim' | 'none'>('none')
  const skipSuggestRef = useRef(false)

  const googleReady = isGooglePlacesConfigured() && !isPlacesDailyCapReached()
  const nominatimReady = isRouteApiConfigured()

  useEffect(() => {
    if (googleReady) setProvider('google')
    else if (nominatimReady) setProvider('nominatim')
    else setProvider('none')
  }, [googleReady, nominatimReady])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Suggest only from the street line — not city/state/ZIP keystrokes.
  useEffect(() => {
    if (disabled || pinned || provider === 'none') return
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false
      return
    }
    const q = parts.street.trim()
    if (q.length < MIN_CHARS) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const t = window.setTimeout(() => {
      void lookupLive(q)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts.street, disabled, pinned, provider])

  async function ensureSession() {
    if (!sessionRef.current) {
      sessionRef.current = await createAutocompleteSessionToken()
    }
    return sessionRef.current
  }

  async function lookupLive(q: string) {
    if (provider === 'none') return
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    setError(null)
    try {
      if (provider === 'google') {
        const token = await ensureSession()
        const list = await fetchPlaceSuggestions({
          input: q,
          sessionToken: token,
          near,
          signal: ac.signal,
        })
        if (ac.signal.aborted) return
        if (list.length === 0 && isPlacesDailyCapReached() && nominatimReady) {
          setProvider('nominatim')
          await lookupNominatim(q, ac.signal)
          return
        }
        setSuggestions(list)
        setOpen(list.length > 0)
      } else {
        await lookupNominatim(q, ac.signal)
      }
    } catch {
      if (ac.signal.aborted) return
      if (provider === 'google' && nominatimReady) {
        setProvider('nominatim')
        try {
          await lookupNominatim(q, ac.signal)
          return
        } catch {
          setSuggestions([])
          setOpen(false)
        }
      } else {
        setSuggestions([])
        setOpen(false)
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }

  async function lookupNominatim(q: string, signal?: AbortSignal) {
    // Bias with city/state already typed when present.
    const bias = [parts.city, parts.state, parts.zip].filter(Boolean).join(', ')
    const query = bias ? `${q}, ${bias}` : q
    const result = await suggestAddress(query, {
      limit: 5,
      context: context || undefined,
      near,
    })
    if (signal?.aborted) return
    const list = (result.suggestions?.length ? result.suggestions : [result]).filter(
      (hit) => hit.quality !== 'area',
    )
    const usable = list.length ? list : result.suggestions?.length ? result.suggestions : [result]
    setSuggestions(usable)
    setOpen(usable.length > 0)
  }

  async function pickGoogle(s: PlaceSuggestion) {
    setLoading(true)
    setError(null)
    try {
      const hit = await resolvePlaceSuggestion(s)
      sessionRef.current = null
      applyHit(hit)
      if (isPlacesDailyCapReached() && nominatimReady) setProvider('nominatim')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resolve address')
    } finally {
      setLoading(false)
    }
  }

  function applyHit(hit: GeocodeHit & {
    street?: string
    city?: string
    state?: string
    zip?: string
  }) {
    skipSuggestRef.current = true
    const parsed = parseManualAddress(hit.display_name)
    const next: ManualAddressParts = {
      street: hit.street?.trim() || parsed.street || hit.display_name,
      city: hit.city?.trim() || parsed.city,
      state: hit.state?.trim() || parsed.state,
      zip: hit.zip?.trim() || parsed.zip,
    }
    setParts(next)
    onChange(composeManualAddress(next) || hit.display_name)
    onPickSuggestion?.(hit)
    setPinned(true)
    setSuggestions([])
    setOpen(false)
    setError(null)
  }

  function pickNominatim(hit: GeocodeHit) {
    applyHit(hit)
  }

  function pick(item: GeocodeHit | PlaceSuggestion) {
    if ('placeId' in item) void pickGoogle(item)
    else pickNominatim(item)
  }

  function updatePart<K extends keyof ManualAddressParts>(key: K, next: string) {
    const updated = {
      ...parts,
      [key]: key === 'state' ? next.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() : next,
    }
    setParts(updated)
    setPinned(false)
    onChange(composeManualAddress(updated))
    setError(null)
    if (key !== 'street') {
      setSuggestions([])
      setOpen(false)
    }
  }

  const composed = composeManualAddress(parts)
  const manualWarning =
    requireStructuredManual &&
    !pinned &&
    composed.trim() &&
    !isManualPartsSufficient(parts)

  const hintSize = compact ? 'text-[10px]' : 'text-xs'
  const fieldClass =
    className ??
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500'

  return (
    <div ref={wrapRef} className="relative min-w-0 w-full">
      <div className={`space-y-2 ${compact ? 'space-y-1.5' : ''}`}>
        <div ref={streetWrapRef} className="relative">
          <input
            className={fieldClass}
            value={parts.street}
            disabled={disabled}
            placeholder={placeholder || 'Street address'}
            aria-label={ariaLabel || 'Street address'}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            autoComplete="street-address"
            onChange={(e) => updatePart('street', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false)
            }}
          />

          {open && suggestions.length > 0 ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-0 right-0 z-[40] mt-1 max-h-48 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-md"
            >
              {suggestions.map((item) => {
                const label = 'placeId' in item ? item.description : item.display_name
                const key =
                  'placeId' in item
                    ? item.placeId
                    : `${item.lat},${item.lng},${item.display_name}`
                return (
                  <li key={key}>
                    <button
                      type="button"
                      role="option"
                      className={`w-full px-2.5 py-1.5 text-left leading-snug text-gray-700 hover:bg-green-50 ${
                        compact ? 'text-[11px]' : 'text-xs'
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(item)}
                    >
                      {label}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        <div
          className={`grid gap-2 ${
            compact ? 'grid-cols-[1fr_3.5rem_4.5rem]' : 'grid-cols-[1fr_4.5rem_5.5rem]'
          }`}
        >
          <input
            className={fieldClass}
            value={parts.city}
            disabled={disabled}
            placeholder="City"
            aria-label="City"
            autoComplete="address-level2"
            onChange={(e) => updatePart('city', e.target.value)}
          />
          <input
            className={fieldClass}
            value={parts.state}
            disabled={disabled}
            placeholder="ST"
            aria-label="State"
            autoComplete="address-level1"
            maxLength={2}
            onChange={(e) => updatePart('state', e.target.value)}
          />
          <input
            className={fieldClass}
            value={parts.zip}
            disabled={disabled}
            placeholder="ZIP"
            aria-label="ZIP"
            autoComplete="postal-code"
            inputMode="numeric"
            onChange={(e) => updatePart('zip', e.target.value.replace(/[^\d-]/g, '').slice(0, 10))}
          />
        </div>
      </div>

      <div className={`mt-1 flex items-center gap-2 ${hintSize} min-h-[1rem]`}>
        {loading ? <span className="text-gray-400">Looking up…</span> : null}
        {!loading && pinned ? <span className="text-gray-500">Mapped</span> : null}
        {error ? <span className="text-red-600">{error}</span> : null}
        {!error && manualWarning ? (
          <span className="text-amber-700">{manualAddressHint()}</span>
        ) : null}
      </div>
    </div>
  )
}

/** Validate before save: empty OK; picked pin OK; else city/state or ZIP. */
export function validateContactAddress(opts: {
  address: string
  pinned: boolean
  requireStructuredManual?: boolean
}): string | null {
  const address = opts.address.trim()
  if (!address) return null
  if (opts.pinned) return null
  if (opts.requireStructuredManual === false) return null
  if (isManualAddressSufficient(address)) return null
  return manualAddressHint()
}
