import type { APIRequestContext } from '@playwright/test'
import { loadDemoManifest, type DemoIds } from './routes'

const API_TIMEOUT_MS = 15_000

function pbUrl(): string {
  return (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || '').replace(/\/$/, '')
}

function appUrl(): string {
  return (process.env.APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
}

export interface ResolvedE2EData {
  ids: DemoIds
  portalPath: string | null
}

let cached: ResolvedE2EData | null = null

async function pbGet<T>(
  request: APIRequestContext,
  path: string,
  token: string,
): Promise<T | null> {
  const base = pbUrl()
  if (!base) return null
  try {
    const res = await request.get(`${base}${path}`, {
      headers: { Authorization: token },
      timeout: API_TIMEOUT_MS,
    })
    if (!res.ok()) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function ensurePortalPath(
  request: APIRequestContext,
  clientId: string,
  jobId: string,
  sessionToken: string,
): Promise<string | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionToken}`,
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await request.post(`${appUrl()}/api/portal/create`, {
        headers,
        data: { clientId, jobId, scope: 'full' },
        timeout: API_TIMEOUT_MS,
      })
      if (!res.ok()) continue
      const data = (await res.json()) as { token?: string; url?: string }
      if (data.token) return `/portal/${data.token}`
      if (data.url) return new URL(data.url).pathname
    } catch {
      // dev server may still be starting
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
    }
  }
  return null
}

export async function resolveE2EData(
  request: APIRequestContext,
  session?: { token: string; record: Record<string, unknown> },
): Promise<ResolvedE2EData> {
  const manifest = loadDemoManifest()
  const ids: DemoIds = { ...(cached?.ids ?? manifest.ids ?? {}) }

  if (session) {
    const token = session.token
    const orgId = String(session.record.organization_id ?? manifest.orgId ?? '')

    if (orgId && !ids.quoteId) {
      const quotes = await pbGet<{ items?: Array<{ id: string }> }>(
        request,
        `/api/collections/quotes/records?perPage=1&sort=-created&filter=${encodeURIComponent(`organization_id="${orgId}"`)}`,
        token,
      )
      if (quotes?.items?.[0]?.id) ids.quoteId = quotes.items[0].id
    }

    const clientId = ids.clientMarcusId || ids.clientId
    if (clientId && !ids.vehicleId) {
      const vehicles = await pbGet<{ items?: Array<{ id: string }> }>(
        request,
        `/api/collections/vehicles/records?perPage=1&sort=-created&filter=${encodeURIComponent(`client_id="${clientId}"`)}`,
        token,
      )
      const vehicleId = vehicles?.items?.[0]?.id
      if (vehicleId) {
        ids.vehicleId = vehicleId
        if (!ids.damageId) {
          const damage = await pbGet<{ items?: Array<{ id: string }> }>(
            request,
            `/api/collections/damage_docs/records?perPage=1&sort=-created&filter=${encodeURIComponent(`vehicle_id="${vehicleId}"`)}`,
            token,
          )
          if (damage?.items?.[0]?.id) ids.damageId = damage.items[0].id
        }
      }
    }
  }

  let portalPath = cached?.portalPath ?? null
  if (!portalPath && session) {
    const clientId = ids.clientMarcusId || ids.clientId
    const jobId = ids.paidJobId
    if (clientId && jobId) {
      portalPath = await ensurePortalPath(request, clientId, jobId, session.token)
    }
  }

  cached = { ids, portalPath }
  return cached
}

export function resetE2EDataCache(): void {
  cached = null
}
