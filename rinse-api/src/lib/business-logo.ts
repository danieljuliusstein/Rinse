/** Sentinel stored in settings when the operator has not uploaded a logo. */
export const DEFAULT_BUSINESS_LOGO_PATH = '/logo.png'

export function hasCustomBusinessLogo(logoUrl?: string | null): boolean {
  const url = logoUrl?.trim()
  if (!url || url === DEFAULT_BUSINESS_LOGO_PATH) return false
  return true
}

/** PocketBase file field — filename string or single-item array depending on SDK version. */
export function pocketBaseRecordHasLogo(logo: unknown): boolean {
  return pocketBaseLogoFilename(logo) != null
}

export function pocketBaseLogoFilename(logo: unknown): string | undefined {
  if (typeof logo === 'string' && logo.trim()) return logo.trim()
  if (Array.isArray(logo) && logo.length > 0) {
    const first = logo[0]
    if (typeof first === 'string' && first.trim()) return first.trim()
  }
  return undefined
}

/** Public API route for a tenant's uploaded logo (`v` busts browser cache after upload). */
export function businessLogoApiUrl(slug: string, cacheBust?: string | number): string {
  const trimmed = slug.trim()
  if (!trimmed) return DEFAULT_BUSINESS_LOGO_PATH
  const params = new URLSearchParams({ slug: trimmed })
  if (cacheBust != null && String(cacheBust) !== '') {
    params.set('v', String(cacheBust))
  }
  return `/api/business-logo?${params.toString()}`
}

/** URL for <img src> when a custom logo exists. */
export function resolveBusinessLogoSrc(logoUrl?: string | null): string | undefined {
  if (!hasCustomBusinessLogo(logoUrl)) return undefined
  return logoUrl!.trim()
}
