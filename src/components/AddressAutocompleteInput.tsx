import { useEffect, useId, useRef, useState } from 'react'
import {
  composeManualAddress,
  emptyManualParts,
  hasManualParts,
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
  addressesLookSame,
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
   * When true, empty address is allowed; non-empty manual address must include
   * city+state or ZIP unless a suggestion was picked.
   */
  requireStructuredManual?: boolean
  /** Compact UI (table cells). */
  compact?: boolean
  /** Pre-existing map pin (edit contact already has lat/lng). */
  initiallyPinned?: boolean
}

const DEBOUNCE_MS = 320
const MIN_CHARS = 3

/**
 * Address search (Google Places → Nominatim) or structured manual entry
 * (street / city / state / ZIP). Manual skips live suggestions.
 */
export default function AddressAutocompleteInput({
  value,
  onChange,
  onPickSuggestion,
  context,
  near,
  className,
  placeholder = 'Start typing an address…',
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
  const [manual, setManual] = useState(false)
  const [parts, setParts] = useState<ManualAddressParts>(() => parseManualAddress(value))
  const [pinned, setPinned] = useState(initiallyPinned)
  const [provider, setProvider] = useState<'google' | 'nominatim' | 'none'>('none')
  const lastLookup = useRef('')

  const googleReady = isGooglePlacesConfigured() && !isPlacesDailyCapReached()
  const nominatimReady = isRouteApiConfigured()
  const useStructuredManual = manual && !compact

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
    if (manual || disabled || pinned) return
    const q = value.trim()
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
  }, [value, manual, disabled, pinned, provider])

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
        lastLookup.current = q
      } else {
        await lookupNominatim(q, ac.signal)
      }
    } catch (e) {
      if (ac.signal.aborted) return
      if (provider === 'google' && nominatimReady) {
        setProvider('nominatim')
        try {
          await lookupNominatim(q, ac.signal)
          return
        } catch (e2) {
          setSuggestions([])
          setError(e2 instanceof Error ? e2.message : 'Could not look up address')
          setOpen(false)
        }
      } else {
        setSuggestions([])
        setError(e instanceof Error ? e.message : 'Could not look up address')
        setOpen(false)
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }

  async function lookupNominatim(q: string, signal?: AbortSignal) {
    const result = await suggestAddress(q, { limit: 5, context, near })
    if (signal?.aborted) return
    lastLookup.current = q
    const list = (result.suggestions?.length ? result.suggestions : [result]).filter(
      (hit) => hit.quality !== 'area',
    )
    const usable = list.length ? list : result.suggestions?.length ? result.suggestions : [result]
    setSuggestions(usable)
    const needsOffer = usable.some((hit) => !addressesLookSame(q, hit.display_name))
    setOpen(needsOffer || usable.length > 1)
  }

  async function pickGoogle(s: PlaceSuggestion) {
    setLoading(true)
    setError(null)
    try {
      const hit = await resolvePlaceSuggestion(s)
      sessionRef.current = null
      onChange(hit.display_name)
      setParts({
        street: hit.street ?? '',
        city: hit.city ?? '',
        state: hit.state ?? '',
        zip: hit.zip ?? '',
      })
      onPickSuggestion?.(hit)
      setPinned(true)
      setSuggestions([])
      setOpen(false)
      lastLookup.current = hit.display_name
      if (isPlacesDailyCapReached() && nominatimReady) setProvider('nominatim')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resolve address')
    } finally {
      setLoading(false)
    }
  }

  function pickNominatim(hit: GeocodeHit) {
    onChange(hit.display_name)
    setParts(parseManualAddress(hit.display_name))
    onPickSuggestion?.(hit)
    setPinned(true)
    lastLookup.current = hit.display_name
    setSuggestions([])
    setOpen(false)
    setError(null)
  }

  function pick(item: GeocodeHit | PlaceSuggestion) {
    if ('placeId' in item) void pickGoogle(item)
    else pickNominatim(item)
  }

  function enterManual() {
    setManual(true)
    setSuggestions([])
    setOpen(false)
    setError(null)
    // Prefer Google-resolved components when present; otherwise parse the freeform line.
    if (hasManualParts(parts)) {
      onChange(composeManualAddress(parts))
    } else if (value.trim()) {
      const parsed = parseManualAddress(value)
      setParts(parsed)
      const composedLine = composeManualAddress(parsed)
      if (composedLine) onChange(composedLine)
    } else {
      setParts(emptyManualParts())
    }
    setPinned(false)
  }

  function leaveManual() {
    // Keep cached parts so re-entering manual stays pre-filled until the search field changes.
    setManual(false)
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
  }

  function onSearchChange(next: string) {
    onChange(next)
    setParts(emptyManualParts())
    setPinned(false)
    setSuggestions([])
    setOpen(false)
    setError(null)
  }

  const composed = useStructuredManual ? composeManualAddress(parts) : value
  const manualWarning =
    requireStructuredManual &&
    !pinned &&
    composed.trim() &&
    (useStructuredManual ? !isManualPartsSufficient(parts) : !isManualAddressSufficient(value))

  const hintSize = compact ? 'text-[10px]' : 'text-xs'
  const fieldClass =
    className ??
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500'

  return (
    <div ref={wrapRef} className="relative min-w-0 w-full">
      {useStructuredManual ? (
        <div className="space-y-2">
          <input
            className={fieldClass}
            value={parts.street}
            disabled={disabled}
            placeholder="Street address"
            aria-label="Street address"
            autoComplete="street-address"
            onChange={(e) => updatePart('street', e.target.value)}
          />
          <div className="grid grid-cols-[1fr_4.5rem_5.5rem] gap-2">
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
      ) : (
        <input
          className={fieldClass}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          autoComplete="street-address"
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
        />
      )}

      <div className={`mt-1.5 flex items-center gap-3 ${hintSize}`}>
        {!manual && provider !== 'none' ? (
          <button
            type="button"
            className="text-gray-500 hover:text-gray-800 hover:underline"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={enterManual}
          >
            Enter manually
          </button>
        ) : manual ? (
          <button
            type="button"
            className="text-green-700 hover:underline"
            disabled={disabled || provider === 'none'}
            onMouseDown={(e) => e.preventDefault()}
            onClick={leaveManual}
          >
            Use address search
          </button>
        ) : null}
        {pinned && !manual ? <span className="text-green-700">Pinned</span> : null}
      </div>

      {loading ? <p className={`mt-0.5 ${hintSize} text-gray-400`}>Looking up…</p> : null}
      {error ? <p className={`mt-0.5 ${hintSize} text-red-600`}>{error}</p> : null}
      {manualWarning ? (
        <p className={`mt-0.5 ${hintSize} text-amber-700`}>{manualAddressHint()}</p>
      ) : null}
      {manual && compact ? (
        <p className={`mt-0.5 ${hintSize} text-gray-400`}>{manualAddressHint()}</p>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-[40] mt-1 max-h-48 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-md"
        >
          {suggestions.map((item) => {
            const label = 'placeId' in item ? item.description : item.display_name
            const key = 'placeId' in item ? item.placeId : `${item.lat},${item.lng},${item.display_name}`
            return (
              <li key={key}>
                <button
                  type="button"
                  role="option"
                  className={`w-full px-2 py-1.5 text-left leading-snug text-gray-700 hover:bg-green-50 ${
                    compact ? 'text-[10px]' : 'text-xs'
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
