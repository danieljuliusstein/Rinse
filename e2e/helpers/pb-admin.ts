import type { APIRequestContext } from '@playwright/test'

const API_TIMEOUT_MS = 15_000

function pbUrl(): string {
  return (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || '').replace(/\/$/, '')
}

export function hasPbSuperuserCredentials(): boolean {
  return Boolean(
    pbUrl() &&
      process.env.PB_ADMIN_EMAIL?.trim() &&
      process.env.PB_ADMIN_PASSWORD?.trim(),
  )
}

export async function getPbSuperuserToken(request: APIRequestContext): Promise<string | null> {
  const base = pbUrl()
  const email = process.env.PB_ADMIN_EMAIL?.trim()
  const password = process.env.PB_ADMIN_PASSWORD?.trim()
  if (!base || !email || !password) return null

  const response = await request.post(`${base}/api/collections/_superusers/auth-with-password`, {
    data: { identity: email, password },
    timeout: API_TIMEOUT_MS,
  })
  if (!response.ok()) return null
  const data = (await response.json()) as { token?: string }
  return data.token ?? null
}

export async function countPbPlatformEvents(
  request: APIRequestContext,
  filter?: string,
): Promise<number | null> {
  const token = await getPbSuperuserToken(request)
  const base = pbUrl()
  if (!token || !base) return null

  const params = new URLSearchParams({ perPage: '1' })
  if (filter) params.set('filter', filter)
  params.set('sort', '-id')

  const response = await request.get(`${base}/api/collections/platform_events/records?${params}`, {
    headers: { Authorization: token },
    timeout: API_TIMEOUT_MS,
  })
  if (!response.ok()) return null
  const data = (await response.json()) as { totalItems?: number }
  return data.totalItems ?? 0
}
