export const DAMAGE_AREA_OPTIONS = [
  'Front bumper',
  'Hood',
  'Driver door',
  'Passenger door',
  'Roof',
  'Rear bumper',
  'Trunk',
  'Wheels',
  'Interior',
  'Other',
] as const

export type DamageAreaOption = (typeof DAMAGE_AREA_OPTIONS)[number]

export function pendingDamagePhotoKey(vehicleId: string): string {
  return `damage_pending_photo_${vehicleId}`
}

export function formatDamageDate(isoDate: string): string {
  if (!isoDate) return '—'
  const d = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatCapturedAt(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function vehicleDisplayName(vehicle: { year?: number; make: string; model: string }): string {
  const parts = [vehicle.year ? String(vehicle.year) : null, vehicle.make, vehicle.model].filter(Boolean)
  return parts.join(' ')
}
