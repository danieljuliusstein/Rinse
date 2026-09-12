import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'

export async function loadOrganizationSlug(): Promise<string | null> {
  if (!(await isOnline())) return null
  try {
    const orgId = requireOrganizationId()
    const pb = getPocketBase()
    const record = await pb.collection('organizations').getOne(orgId, { fields: 'slug' })
    const slug = String((record as { slug?: string }).slug ?? '').trim()
    return slug || null
  } catch {
    return null
  }
}

export function appOrigin(): string {
  // Customer-facing booking/portal links — app host (not marketing rinsehq.com).
  const web = process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim()
  if (web) return web.replace(/\/$/, '')

  const api = process.env.EXPO_PUBLIC_APP_API_URL?.trim()
  if (api && !/localhost|127\.0\.0\.1/i.test(api)) {
    return api.replace(/\/$/, '')
  }

  return 'https://app.rinsehq.com'
}
