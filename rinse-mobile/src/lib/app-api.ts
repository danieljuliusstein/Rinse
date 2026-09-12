import { getAuthToken } from './auth'
import { getAppApiUrl } from './pocketbase'

export class AppApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'AppApiError'
  }
}

function networkErrorMessage(base: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/failed to fetch|network request failed|load failed|could not connect|connection refused/i.test(msg)) {
    const hint = /localhost|127\.0\.0\.1/i.test(base)
      ? 'Start apps/api (`npm run dev`) on :3000, or set EXPO_PUBLIC_APP_API_URL to your machine LAN IP for a physical device.'
      : 'Check your connection and that the API is reachable.'
    return `Can't reach API at ${base}. ${hint}`
  }
  return msg || 'Request failed'
}

export async function appApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getAppApiUrl().replace(/\/$/, '')
  if (!base) throw new AppApiError('EXPO_PUBLIC_APP_API_URL is not configured', 0)

  const token = getAuthToken()
  if (!token) throw new AppApiError('Not authenticated', 401)

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Authorization', `Bearer ${token}`)

  try {
    return await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
    })
  } catch (err) {
    throw new AppApiError(networkErrorMessage(base, err), 0)
  }
}

export async function appApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await appApiFetch(path, init)
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new AppApiError(data.error ?? `Request failed (${res.status})`, res.status)
  }
  return res.json() as Promise<T>
}
