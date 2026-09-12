import type { APIRequestContext } from '@playwright/test'
import type { PocketBaseSession } from './admin-session'

function authHeaders(session: PocketBaseSession): Record<string, string> {
  return { Authorization: `Bearer ${session.token}` }
}

export async function fetchAdminApi<T>(
  request: APIRequestContext,
  session: PocketBaseSession,
  path: string,
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await request.get(path, { headers: authHeaders(session) })
  const data = (await response.json().catch(() => ({}))) as T
  return { ok: response.ok(), status: response.status(), data }
}

export async function postAdminApi<T>(
  request: APIRequestContext,
  session: PocketBaseSession,
  path: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await request.post(path, {
    headers: { ...authHeaders(session), 'Content-Type': 'application/json' },
    data: body,
  })
  const data = (await response.json().catch(() => ({}))) as T
  return { ok: response.ok(), status: response.status(), data }
}
