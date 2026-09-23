import { getPocketBase, getAppApiUrl } from './pocketbase'

export class AppApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'AppApiError'
  }
}

function authToken(): string {
  const pb = getPocketBase()
  if (!pb.authStore.isValid || !pb.authStore.token) {
    throw new AppApiError('Not authenticated', 401)
  }
  return pb.authStore.token
}

export async function appApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getAppApiUrl().replace(/\/$/, '')
  if (!base) throw new AppApiError('VITE_APP_API_URL is not configured', 0)

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Authorization', `Bearer ${authToken()}`)

  try {
    return await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Request failed'
    throw new AppApiError(`Can't reach API at ${base}. ${msg}`, 0)
  }
}

export async function appApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await appApiFetch(path, init)
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
    if (res.status === 402 || data.code === 'premium_required') {
      throw new AppApiError(
        data.error ??
          'Active subscription required. Open Settings → Billing on mobile to upgrade or restore access.',
        402,
      )
    }
    throw new AppApiError(data.error ?? `Request failed (${res.status})`, res.status)
  }
  return res.json() as Promise<T>
}

/** Download a PDF response and trigger a browser save dialog. */
export async function appApiDownloadPdf(
  path: string,
  body: unknown,
  fallbackFilename: string,
): Promise<void> {
  const res = await appApiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
    if (res.status === 402 || data.code === 'premium_required') {
      throw new AppApiError(
        data.error ??
          'Active subscription required. Open Settings → Billing on mobile to upgrade or restore access.',
        402,
      )
    }
    throw new AppApiError(data.error ?? `PDF failed (${res.status})`, res.status)
  }

  const disposition = res.headers.get('Content-Disposition') || ''
  const match = /filename="([^"]+)"/i.exec(disposition)
  const filename = match?.[1] || fallbackFilename
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}
