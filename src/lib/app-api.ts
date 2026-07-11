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

  return fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
  })
}

export async function appApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await appApiFetch(path, init)
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new AppApiError(data.error ?? `Request failed (${res.status})`, res.status)
  }
  return res.json() as Promise<T>
}
