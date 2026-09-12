/** Normalize and validate a vehicle paint hex (#rgb or #rrggbb). */
export function normalizeVehicleColorHex(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  const hex = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [, r, g, b] = hex
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex}`.toLowerCase()
  return undefined
}

export function vehicleColorDisplayHex(value: string | undefined, fallback = '#888888'): string {
  return normalizeVehicleColorHex(value) ?? fallback
}

/** Pick a light or dark icon color that contrasts with a paint hex. */
export function vehicleIconColorOnPaint(hex: string | undefined): string {
  const normalized = normalizeVehicleColorHex(hex)
  if (!normalized) return '#3a6a9a'
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#071407' : '#ffffff'
}
