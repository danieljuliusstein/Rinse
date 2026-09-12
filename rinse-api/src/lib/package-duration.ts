export const PACKAGE_DURATION_PRESETS = [
  { minutes: 90, label: '1.5 hours' },
  { minutes: 120, label: '2 hours' },
  { minutes: 180, label: '3 hours' },
  { minutes: 240, label: '4 hours' },
  { minutes: 300, label: '5 hours' },
  { minutes: 360, label: '6 hours' },
] as const

export function durationPresetLabel(minutes: number): string {
  const preset = PACKAGE_DURATION_PRESETS.find((p) => p.minutes === minutes)
  if (preset) return preset.label
  if (minutes < 60) return `${minutes} min`
  const h = minutes / 60
  return Number.isInteger(h) ? `${h} hours` : `${h.toFixed(1)} hours`
}
