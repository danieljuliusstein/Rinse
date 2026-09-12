/** Default revisit interval when a package has no cadence set. */
export const DEFAULT_RETURN_DAYS = 90

export interface CadencePreset {
  label: string
  days: number
  hint: string
}

export const CADENCE_PRESETS: CadencePreset[] = [
  { label: 'Monthly', days: 30, hint: 'Maintenance / wash plans' },
  { label: 'Quarterly', days: 90, hint: 'Standard full detail' },
  { label: 'Biannual', days: 180, hint: 'Premium / paint correction' },
  { label: 'Annual', days: 365, hint: 'Ceramic coat & long-term protection' },
]

export function normalizeReturnDays(days: number | undefined | null): number {
  if (days == null || !Number.isFinite(days) || days < 7) return DEFAULT_RETURN_DAYS
  return Math.round(days)
}

export function cadencePresetLabel(days: number): string {
  const preset = CADENCE_PRESETS.find((p) => p.days === days)
  return preset ? preset.label : `Every ${days} days`
}
