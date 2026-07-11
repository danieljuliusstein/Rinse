/** Whole-dollar money input helpers (matches PWA FloatingAffixField intent). */
export function parseMoneyInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits)
}

export function formatMoneyInput(value: number | undefined): string {
  if (value === undefined || value === 0) return ''
  return String(Math.round(value))
}
