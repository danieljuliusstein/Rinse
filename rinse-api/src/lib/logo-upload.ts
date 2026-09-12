export const LOGO_MAX_BYTES = 5 * 1024 * 1024

export const LOGO_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const LOGO_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

export function validateLogoFile(file: File): string | null {
  if (!LOGO_ALLOWED_MIME_TYPES.includes(file.type as (typeof LOGO_ALLOWED_MIME_TYPES)[number])) {
    return 'Use a JPG, PNG, WebP, or GIF image.'
  }
  if (file.size > LOGO_MAX_BYTES) {
    return 'Logo must be 5 MB or smaller.'
  }
  if (file.size === 0) {
    return 'That file appears to be empty.'
  }
  return null
}
