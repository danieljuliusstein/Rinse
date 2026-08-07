/** US manual-entry helpers: structured street / city / state / ZIP. */

const US_ZIP = /\b\d{5}(?:-\d{4})?\b/
/** e.g. "City, ST" or "City ST 12345" */
const CITY_STATE = /[A-Za-z][A-Za-z\s.'-]{1,},\s*[A-Za-z]{2}\b/

/** Lowercase name → USPS 2-letter code */
const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
}

const US_STATE_CODES = new Set(Object.values(STATE_NAME_TO_CODE))

export type ManualAddressParts = {
  street: string
  city: string
  state: string
  zip: string
}

export const emptyManualParts = (): ManualAddressParts => ({
  street: '',
  city: '',
  state: '',
  zip: '',
})

/** Compose US-style line: "123 Main St, Haddonfield, NJ 08033" */
export function composeManualAddress(parts: ManualAddressParts): string {
  const street = parts.street.trim()
  const city = parts.city.trim()
  const state = parts.state.trim().toUpperCase()
  const zip = parts.zip.trim()
  const stateZip = [state, zip].filter(Boolean).join(' ')
  const cityLine = [city, stateZip].filter(Boolean).join(', ')
  return [street, cityLine].filter(Boolean).join(', ')
}

/** Strip trailing country (“USA”, “United States”, …) Google/Nominatim often append. */
function stripTrailingCountry(address: string): string {
  return address
    .replace(
      /,\s*(USA|U\.S\.A\.|United States(?: of America)?|US|United States Minor Outlying Islands)\s*$/i,
      '',
    )
    .trim()
}

function normalizeStateToken(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  if (/^[A-Za-z]{2}$/.test(t) && US_STATE_CODES.has(t.toUpperCase())) {
    return t.toUpperCase()
  }
  const code = STATE_NAME_TO_CODE[t.toLowerCase()]
  return code ?? null
}

/**
 * Best-effort parse of a single-line address into parts.
 * Handles Google ("street, city, ST ZIP, USA") and Nominatim
 * ("street, city, County, State, ZIP, United States") by peeling from the end.
 */
export function parseManualAddress(address: string): ManualAddressParts {
  let t = stripTrailingCountry(address.trim())
  if (!t) return emptyManualParts()

  let zip = ''
  const zipM = t.match(/,?\s*(\d{5}(?:-\d{4})?)\s*$/)
  if (zipM && zipM.index != null) {
    zip = zipM[1]!
    t = t.slice(0, zipM.index).replace(/[,\s]+$/, '').trim()
  }

  let state = ''
  // ", TX" or ", Texas" at end
  const stateM = t.match(/,?\s*([A-Za-z][A-Za-z\s.]+)$/)
  if (stateM && stateM.index != null) {
    const code = normalizeStateToken(stateM[1]!)
    if (code) {
      state = code
      t = t.slice(0, stateM.index).replace(/[,\s]+$/, '').trim()
    }
  }

  // Drop county / extra admin layers Nominatim inserts before city
  // e.g. "123 Main, Austin, Travis County" → street + city
  const segments = t
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/\bcounty\b/i.test(s))

  if (segments.length >= 2) {
    const city = segments[segments.length - 1]!
    const street = segments.slice(0, -1).join(', ')
    return { street, city, state, zip }
  }

  if (segments.length === 1) {
    // "City ST" without commas, or street-only
    const lone = segments[0]!
    const citySt = lone.match(/^(.+?)\s+([A-Za-z]{2})$/)
    if (citySt && !state) {
      const code = normalizeStateToken(citySt[2]!)
      if (code) {
        return { street: '', city: citySt[1]!.trim(), state: code, zip }
      }
    }
    return { street: lone, city: '', state, zip }
  }

  return { street: t, city: '', state, zip }
}

export function hasManualParts(parts: ManualAddressParts): boolean {
  return Boolean(parts.street.trim() || parts.city.trim() || parts.state.trim() || parts.zip.trim())
}

export function isManualPartsSufficient(parts: ManualAddressParts): boolean {
  if (US_ZIP.test(parts.zip.trim())) return true
  const city = parts.city.trim()
  const state = parts.state.trim()
  if (city && /^[A-Za-z]{2}$/.test(state)) return true
  return isManualAddressSufficient(composeManualAddress(parts))
}

export function isManualAddressSufficient(address: string): boolean {
  const t = address.trim()
  if (!t) return false
  if (US_ZIP.test(t)) return true
  if (CITY_STATE.test(t)) return true
  const parsed = parseManualAddress(t)
  if (parsed.city && parsed.state) return true
  if (US_ZIP.test(parsed.zip)) return true
  return false
}

export function manualAddressHint(): string {
  return 'Add city and state, or a ZIP.'
}
