/**
 * Opens the device Messages app with a prefilled body (Invoice Fly / click-to-text pattern).
 * User must tap Send — the web app cannot send SMS directly.
 */

export function normalizePhoneForSms(phone: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (trimmed.startsWith('+') && digits.length >= 10) return `+${digits}`
  if (digits.length >= 10) return `+${digits}`

  return null
}

/** Cross-platform SMS deep link (`?&body=` works on iOS and Android). */
export function buildSmsComposeUrl(phone: string, body: string): string | null {
  const normalized = normalizePhoneForSms(phone)
  if (!normalized) return null

  const text = body.trim()
  if (!text) return `sms:${normalized}`

  return `sms:${normalized}?&body=${encodeURIComponent(text)}`
}
