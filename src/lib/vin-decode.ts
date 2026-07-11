const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i

export interface VinDecodeResult {
  vin: string
  make: string | null
  model: string | null
  year: number | null
}

type NhtsaRow = { Variable?: string; Value?: string }

export function normalizeVin(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export function isValidVin(vin: string): boolean {
  return VIN_PATTERN.test(normalizeVin(vin))
}

/** Pull a VIN out of noisy barcode / OCR text. */
export function extractVinCandidate(raw: string): string | null {
  const cleaned = normalizeVin(raw)
  if (isValidVin(cleaned)) return cleaned
  const match = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/)
  if (match && isValidVin(match[0])) return match[0]
  return null
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
