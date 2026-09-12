const PLATFORM_ADMIN_CACHE_PREFIX = 'rinse_platform_admin:'

function cacheKey(email: string): string {
  return `${PLATFORM_ADMIN_CACHE_PREFIX}${email.toLowerCase()}`
}

export function readCachedPlatformAdmin(email: string): boolean | null {
  if (typeof window === 'undefined') return null
  const cached = sessionStorage.getItem(cacheKey(email))
  if (cached === '1') return true
  if (cached === '0') return false
  return null
}

export function writeCachedPlatformAdmin(email: string, admin: boolean): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(cacheKey(email), admin ? '1' : '0')
}

export function clearCachedPlatformAdmin(email?: string | null): void {
  if (typeof window === 'undefined') return
  if (email) {
    sessionStorage.removeItem(cacheKey(email))
    return
  }
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i)
    if (key?.startsWith(PLATFORM_ADMIN_CACHE_PREFIX)) {
      sessionStorage.removeItem(key)
    }
  }
}
