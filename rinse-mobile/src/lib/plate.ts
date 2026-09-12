/** US/CA-style plate: 2–10 alphanumeric chars. */
const PLATE_PATTERN = /^[A-Z0-9]{2,10}$/

export function normalizePlate(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export function isPlausiblePlate(raw: string): boolean {
  return PLATE_PATTERN.test(normalizePlate(raw))
}

export function extractPlateCandidate(raw: string): string | null {
  const cleaned = normalizePlate(raw)
  if (isPlausiblePlate(cleaned)) return cleaned
  const match = cleaned.match(/[A-Z0-9]{2,10}/)
  return match && isPlausiblePlate(match[0]) ? match[0] : null
}
