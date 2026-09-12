export function computeFormProgress(values: string[], extras = 0, extraFilled = 0): number {
  const filled = values.filter((v) => v.trim().length > 0).length + extraFilled
  const total = values.length + extras
  if (total === 0) return 0
  return Math.min(100, Math.round((filled / total) * 100))
}

export function isFormSubmittable(
  progress: number,
  requiredFilled: boolean,
  isEdit: boolean,
  minProgress = 40,
): boolean {
  if (!requiredFilled) return false
  if (isEdit) return true
  return progress >= minProgress
}
