import { Platform } from 'react-native'

const QUERY_KEYS = ['screenshot', 'screenshotMode'] as const

/** True when `?screenshot=1` or `?screenshotMode` is on the URL (web only). */
export function isScreenshotModeUrl(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return QUERY_KEYS.some((key) => params.get(key) === '1' || params.has(key))
}

export function isScreenshotMode(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false
  return isScreenshotModeUrl(window.location.search)
}

/** Append screenshot query to a path for marketing / Playwright captures. */
export function withScreenshotMode(path: string): string {
  const [base, hash = ''] = path.split('#')
  const [pathname, search = ''] = base.split('?')
  const params = new URLSearchParams(search)
  if (!params.has('screenshot')) params.set('screenshot', '1')
  const query = params.toString()
  const withQuery = query ? `${pathname}?${query}` : pathname
  return hash ? `${withQuery}#${hash}` : withQuery
}
