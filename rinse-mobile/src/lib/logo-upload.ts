export const LOGO_MAX_BYTES = 5 * 1024 * 1024

export const LOGO_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type LogoAsset = {
  mimeType?: string | null
  fileSize?: number | null
}

export function validateLogoAsset(asset: LogoAsset): string | null {
  const mime = asset.mimeType?.trim()
  if (mime && !LOGO_ALLOWED_MIME_TYPES.includes(mime as (typeof LOGO_ALLOWED_MIME_TYPES)[number])) {
    return 'Use a JPG, PNG, WebP, or GIF image.'
  }
  if (typeof asset.fileSize === 'number' && asset.fileSize > LOGO_MAX_BYTES) {
    return 'Logo must be 5 MB or smaller.'
  }
  if (asset.fileSize === 0) {
    return 'That file appears to be empty.'
  }
  return null
}
