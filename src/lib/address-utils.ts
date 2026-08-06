/** US manual-entry helpers: structured street / city / state / ZIP. */

const US_ZIP = /\b\d{5}(?:-\d{4})?\b/
/** e.g. "City, ST" or "City ST 12345" */
const CITY_STATE = /[A-Za-z][A-Za-z\s.'-]{1,},\s*[A-Za-z]{2}\b/

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

/** Strip trailing country (“USA”, “United States”, …) Google often appends. */
function stripTrailingCountry(address: string): string {
  return address
    .replace(/,\s*(USA|U\.S\.A\.|United States(?: of America)?|US)\s*$/i, '')
    .trim()
}

/**
 * Best-effort parse of a single-line address into parts.
 * Handles "street, city, ST ZIP", "city, ST ZIP", or falls back to street (+ ZIP if found).
 */
export function parseManualAddress(address: string): ManualAddressParts {
  const t = stripTrailingCountry(address.trim())
  if (!t) return emptyManualParts()

  const full = t.match(/^(.+?),\s*([^,]+),\s*([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?\s*$/)
  if (full) {
    return {
      street: full[1]!.trim(),
      city: full[2]!.trim(),
      state: full[3]!.trim().toUpperCase(),
      zip: (full[4] || '').trim(),
    }
  }

  const cityOnly = t.match(/^([^,]+),\s*([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?\s*$/)
  if (cityOnly) {
    return {
      street: '',
      city: cityOnly[1]!.trim(),
      state: cityOnly[2]!.trim().toUpperCase(),
      zip: (cityOnly[3] || '').trim(),
    }
  }

  const zipMatch = t.match(US_ZIP)
  return {
    street: t,
    city: '',
    state: '',
    zip: zipMatch?.[0] ?? '',
  }
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
  return false
}

export function manualAddressHint(): string {
  return 'Add city and state, or a ZIP.'
}
