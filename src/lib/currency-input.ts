/** Parse user typing into a dollar amount (whole dollars while editing). */
export function parseCurrencyTyping(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (!cleaned) return 0
  const parts = cleaned.split('.')
  if (parts.length > 2) return Number(parts[0] + '.' + parts.slice(1).join('')) || 0
  if (parts.length === 2 && parts[1].length > 2) {
    return Number(`${parts[0]}.${parts[1].slice(0, 2)}`) || 0
  }
  return Number(cleaned) || 0
}

/** Whole dollars while focused; two decimals on blur. */
export function formatCurrencyEditing(value: number, focused: boolean): string {
  if (!value || Number.isNaN(value)) return ''
  if (focused) {
    if (Number.isInteger(value)) return String(value)
    return String(value)
  }
  return value.toFixed(2)
}

/** Strip to digits for whole-dollar typing mode. */
export function sanitizeWholeDollarInput(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function wholeDollarsToNumber(digits: string): number {
  if (!digits) return 0
  return Number(digits) || 0
}
