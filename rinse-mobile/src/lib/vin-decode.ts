const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i

export interface VinDecodeResult {
  vin: string
  make: string | null
  model: string | null
  year: number | null
}

type NhtsaRow = { Variable?: string; Value?: string }

const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
}

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

export function normalizeVin(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export function isValidVin(vin: string): boolean {
  return VIN_PATTERN.test(normalizeVin(vin))
}

/** ISO 3779 check digit (position 9). US/CA VINs should pass; used to pick among candidates. */
export function vinCheckDigitOk(vin: string): boolean {
  const v = normalizeVin(vin)
  if (!isValidVin(v)) return false
  let sum = 0
  for (let i = 0; i < 17; i++) {
    const val = VIN_TRANSLITERATION[v[i]]
    if (val == null) return false
    sum += val * VIN_WEIGHTS[i]
  }
  const mod = sum % 11
  const expected = mod === 10 ? 'X' : String(mod)
  return v[8] === expected
}

/** Fix common barcode/OCR letter↔digit swaps that invalidate a VIN. */
function softenVinConfusions(raw: string): string {
  return raw.replace(/I/g, '1').replace(/[OQ]/g, '0')
}

function candidatesIn(raw: string): string[] {
  const cleaned = normalizeVin(raw)
  const out: string[] = []
  if (cleaned.length === 17 && isValidVin(cleaned)) out.push(cleaned)
  for (let i = 0; i <= cleaned.length - 17; i++) {
    const slice = cleaned.slice(i, i + 17)
    if (isValidVin(slice)) out.push(slice)
  }
  return out
}

function pickVinCandidate(raw: string): string | null {
  const candidates = candidatesIn(raw)
  if (candidates.length === 0) return null
  const checked = candidates.find((c) => vinCheckDigitOk(c))
  if (checked) return checked
  // Exact-length barcode/manual entry — accept charset-valid even if check digit fails (non-US).
  const cleaned = normalizeVin(raw)
  if (cleaned.length === 17 && isValidVin(cleaned)) return cleaned
  return candidates[0] ?? null
}

/** Pull a VIN out of noisy barcode / OCR text. */
export function extractVinCandidate(raw: string): string | null {
  return pickVinCandidate(raw) ?? pickVinCandidate(softenVinConfusions(raw))
}

function readNhtsaValue(rows: NhtsaRow[], variable: string): string | null {
  const row = rows.find((r) => r.Variable === variable)
  const value = row?.Value?.trim()
  if (!value || value === 'Not Applicable' || value === 'Not Provided') return null
  return value
}

export async function decodeVin(raw: string): Promise<VinDecodeResult> {
  const vin = normalizeVin(raw)
  if (!isValidVin(vin)) {
    throw new Error('VIN must be 17 characters (letters and numbers, no I/O/Q).')
  }

  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`,
  )
  if (!res.ok) throw new Error('Could not decode VIN')

  const data = (await res.json()) as { Results?: NhtsaRow[] }
  const rows = data.Results ?? []

  const yearRaw = readNhtsaValue(rows, 'Model Year')
  const year = yearRaw ? Number(yearRaw) : null

  return {
    vin,
    make: readNhtsaValue(rows, 'Make'),
    model: readNhtsaValue(rows, 'Model'),
    year: year != null && Number.isFinite(year) ? year : null,
  }
}
