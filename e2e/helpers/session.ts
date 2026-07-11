import PocketBase from 'pocketbase'
import { requireVisualTestCredentials } from './env'

export interface VisualTestSession {
  pb: PocketBase
  orgId: string
  token: string
  record: Record<string, unknown>
  /** Public booking + portal URLs for customer marketing shots (rinsehq.com). */
  customer: {
    bookingUrl: string | null
    portalUrl: string | null
  }
  entities: {
    jobId: string | null
    /** Prefer a job that already has gallery photos (marketing captures). */
    photoJobId: string | null
    clientId: string | null
    invoiceId: string | null
  }
}

export async function createVisualTestSession(): Promise<VisualTestSession> {
  const { email, password, pbUrl } = requireVisualTestCredentials()
  const pb = new PocketBase(pbUrl)
  await pb.collection('users').authWithPassword(email, password)

  if (!pb.authStore.isValid || !pb.authStore.token || !pb.authStore.record) {
    throw new Error('PocketBase auth failed for visual audit credentials')
  }

  const orgId = pb.authStore.record.organization_id
  if (typeof orgId !== 'string' || !orgId) {
    throw new Error('Test user has no organization_id — complete onboarding on web first')
  }

  await ensureOnboardingComplete(pb, orgId)

  const entities = await loadVisualTestEntities(pb, orgId)
  const customer = await resolveCustomerMarketingUrls(pb, orgId, pb.authStore.token, entities)

  return {
    pb,
    orgId,
    token: pb.authStore.token,
    record: pb.authStore.record as unknown as Record<string, unknown>,
    customer,
    entities,
  }
}

async function loadVisualTestEntities(
  pb: PocketBase,
  orgId: string,
): Promise<VisualTestSession['entities']> {
  const orgFilter = `organization_id = "${orgId}"`

  const [jobId, photoJobId, clientId, invoiceId] = await Promise.all([
    firstRecordId(pb, 'jobs', { sort: '-date', filter: orgFilter }),
    firstJobWithPhotos(pb, orgId),
    firstRecordId(pb, 'clients', { sort: 'name', filter: orgFilter }),
    firstRecordId(pb, 'invoices', { sort: '-id', filter: orgFilter }),
  ])

  return { jobId, photoJobId: photoJobId ?? jobId, clientId, invoiceId }
}

async function firstJobWithPhotos(pb: PocketBase, orgId: string): Promise<string | null> {
  try {
    const list = await pb.collection('jobs').getList(1, 40, {
      sort: '-date',
      filter: `organization_id = "${orgId}"`,
    })
    const withPhotos = list.items.find((row) => Array.isArray(row.photos) && row.photos.length > 0)
    return withPhotos?.id ?? null
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[visual-audit] Could not find job with photos: ${message}`)
    return null
  }
}

async function resolveCustomerMarketingUrls(
  pb: PocketBase,
  orgId: string,
  token: string,
  entities: VisualTestSession['entities'],
): Promise<VisualTestSession['customer']> {
  const appUrl = (process.env.EXPO_PUBLIC_APP_API_URL || 'https://rinsehq.com').replace(/\/$/, '')
  let bookingUrl: string | null = null
  let portalUrl: string | null = null

  try {
    const org = await pb.collection('organizations').getOne(orgId)
    const slug = String(org.slug ?? '').trim()
    if (slug) bookingUrl = `${appUrl}/book/${slug}`
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[marketing] Could not resolve booking slug: ${message}`)
  }

  if (entities.clientId) {
    try {
      const res = await fetch(`${appUrl}/api/portal/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: entities.clientId,
          jobId: entities.jobId ?? undefined,
          scope: entities.invoiceId ? 'invoice' : 'full',
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as { url?: string; token?: string }
        if (typeof data.url === 'string' && data.url) {
          portalUrl = data.url
        } else if (typeof data.token === 'string' && data.token) {
          portalUrl = `${appUrl}/portal/${data.token}`
        }
      } else {
        console.warn(`[marketing] Portal create failed: HTTP ${res.status}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[marketing] Portal create error: ${message}`)
    }
  }

  return { bookingUrl, portalUrl }
}

async function firstRecordId(
  pb: PocketBase,
  collection: string,
  options: { sort: string; filter?: string },
): Promise<string | null> {
  try {
    const list = await pb.collection(collection).getList(1, 1, options)
    return list.items[0]?.id ?? null
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[visual-audit] Could not load ${collection}: ${message}`)
    return null
  }
}

export async function ensureOnboardingComplete(pb: PocketBase, orgId: string): Promise<void> {
  const list = await pb.collection('app_settings').getList(1, 1, {
    filter: `organization_id = "${orgId}"`,
  })
  const row = list.items[0]
  if (!row) return
  if (row.onboarding_completed_at) return
  await pb.collection('app_settings').update(row.id, {
    onboarding_completed_at: new Date().toISOString().slice(0, 10),
    onboarding_step: 4,
  })
}

export async function setOnboardingIncomplete(
  pb: PocketBase,
  orgId: string,
  step: number,
): Promise<void> {
  const list = await pb.collection('app_settings').getList(1, 1, {
    filter: `organization_id = "${orgId}"`,
  })
  const row = list.items[0]
  if (!row) throw new Error('No app_settings row for visual audit org')
  await pb.collection('app_settings').update(row.id, {
    onboarding_completed_at: '',
    onboarding_step: step,
  })
}
