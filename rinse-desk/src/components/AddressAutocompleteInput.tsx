import { useEffect, useId, useRef, useState } from 'react'
import {
  composeManualAddress,
  emptyManualParts,
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
  type ResolvedPlace,
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

/** Desk rinse inputs — matches Contacts table / primary forms. */
const RINSE_FIELD =
  'w-full min-w-0 h-9 px-3 rounded-md bg-white border border-rinse-border text-[13px] text-rinse-text placeholder:text-rinse-muted/80 focus:outline-none focus:ring-2 focus:ring-rinse-green/25 focus:border-rinse-green-border transition disabled:opacity-60'

const RINSE_FIELD_COMPACT =
  'w-full min-w-0 h-8 px-2.5 rounded-md bg-white border border-rinse-border text-[12.5px] text-rinse-text placeholder:text-rinse-muted/80 focus:outline-none focus:ring-2 focus:ring-rinse-green/30 focus:border-rinse-green-border transition disabled:opacity-60'

function mergeParts(
  hit: GeocodeHit & { street?: string; city?: string; state?: string; zip?: string },
  fallbackLine?: string,
): ManualAddressParts {
  const fromLine = parseManualAddress(hit.display_name)
  const fromFallback = fallbackLine ? parseManualAddress(fallbackLine) : emptyManualParts()
  return {
    street:
      hit.street?.trim() ||
      fromLine.street ||
      fromFallback.street ||
      hit.display_name,
    city: hit.city?.trim() || fromLine.city || fromFallback.city,
    state: (hit.state?.trim() || fromLine.state || fromFallback.state).toUpperCase(),
    zip: hit.zip?.trim() || fromLine.zip || fromFallback.zip,
  }
}

/**
 * Checkout-style address entry: street · city · state · ZIP always visible.
 * Autocomplete on the street field only; pick fills the rest.
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

  const fieldClass = className ?? (compact ? RINSE_FIELD_COMPACT : RINSE_FIELD)

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
      const hit: ResolvedPlace = await resolvePlaceSuggestion(s)
      sessionRef.current = null
      applyHit(hit, s.description)
      if (isPlacesDailyCapReached() && nominatimReady) setProvider('nominatim')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resolve address')
    } finally {
      setLoading(false)
    }
  }

  function applyHit(
    hit: GeocodeHit & { street?: string; city?: string; state?: string; zip?: string },
    fallbackLine?: string,
  ) {
    skipSuggestRef.current = true
    const next = mergeParts(hit, fallbackLine)
    const line = composeManualAddress(next) || hit.display_name
    setParts(next)
    onChange(line)
    onPickSuggestion?.({ ...hit, display_name: line })
    setPinned(true)
    setSuggestions([])
    setOpen(false)
    setError(null)
  }

  function pick(item: GeocodeHit | PlaceSuggestion) {
    if ('placeId' in item) void pickGoogle(item)
    else applyHit(item, item.display_name)
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

  const hintSize = compact ? 'text-[10px]' : 'text-[11px]'
  const labelCls = compact
    ? 'text-[10px] font-medium text-rinse-muted mb-0.5 block'
    : 'text-[11px] font-medium text-rinse-muted mb-1 block'

  return (
    <div ref={wrapRef} className="relative min-w-0 w-full">
      <div className={`space-y-2 ${compact ? 'space-y-1.5' : 'space-y-2.5'}`}>
        <div className="relative">
          {!compact ? <span className={labelCls}>Street</span> : null}
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
              className="absolute left-0 right-0 z-[40] mt-1 max-h-48 overflow-auto rounded-md border border-rinse-border bg-white py-1 shadow-sm"
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
                      className={`w-full px-3 py-2 text-left leading-snug text-rinse-text hover:bg-rinse-green-soft ${
                        compact ? 'text-[11px]' : 'text-[12.5px]'
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
            compact ? 'grid-cols-[1fr_4.25rem_4.75rem]' : 'grid-cols-[1fr_5.5rem_6rem]'
          }`}
        >
          <div className="min-w-0">
            <span className={labelCls}>City</span>
            <input
              className={fieldClass}
              value={parts.city}
              disabled={disabled}
              placeholder="City"
              aria-label="City"
              autoComplete="address-level2"
              onChange={(e) => updatePart('city', e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <span className={labelCls}>State</span>
            <input
              className={`${fieldClass} uppercase text-center tracking-wide`}
              value={parts.state}
              disabled={disabled}
              placeholder="State"
              aria-label="State"
              autoComplete="address-level1"
              maxLength={2}
              onChange={(e) => updatePart('state', e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <span className={labelCls}>ZIP</span>
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
      </div>

      <div className={`mt-1.5 flex items-center gap-2 ${hintSize} min-h-[1rem]`}>
        {loading ? <span className="text-rinse-muted">Looking up…</span> : null}
        {!loading && pinned ? (
          <span className="text-rinse-green-text font-medium">Mapped</span>
        ) : null}
        {error ? <span className="text-rinse-danger">{error}</span> : null}
        {!error && manualWarning ? (
          <span className="text-rinse-amber">{manualAddressHint()}</span>
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
