/** Cross-platform SMS deep link — mirrors detailing-app/src/lib/sms-compose.ts */

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

export function buildSmsComposeUrl(phone: string, body: string): string | null {
  const normalized = normalizePhoneForSms(phone)
  if (!normalized) return null

  const text = body.trim()
  if (!text) return `sms:${normalized}`

  return `sms:${normalized}?&body=${encodeURIComponent(text)}`
}
