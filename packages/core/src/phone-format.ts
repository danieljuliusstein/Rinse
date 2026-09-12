import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js'

/** Format digits for display while typing (US). */
export function formatPhoneAsYouType(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return new AsYouType('US').input(digits)
}

/** Normalize to E.164 when valid; otherwise strip to digits. */
export function normalizeUSPhone(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const parsed = parsePhoneNumberFromString(trimmed, 'US')
  if (parsed?.isValid()) return parsed.format('E.164')
  return trimmed.replace(/\D/g, '')
}

/** Display-friendly national format for prefill/storage values. */
export function formatUSPhoneDisplay(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const parsed = parsePhoneNumberFromString(trimmed, 'US')
  if (parsed?.isValid()) return parsed.formatNational()
  return formatPhoneAsYouType(trimmed)
}

export function isValidUSPhone(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  const parsed = parsePhoneNumberFromString(trimmed, 'US')
  return parsed?.isValid() ?? false
}

export function isValidUSPhoneOptional(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return true
  return isValidUSPhone(trimmed)
}
