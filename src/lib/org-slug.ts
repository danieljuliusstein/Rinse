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
  // Customer-facing booking/portal links — prefer public web origin when API is local.
  return (
    process.env.EXPO_PUBLIC_WEB_ORIGIN ??
    process.env.EXPO_PUBLIC_APP_API_URL ??
    'https://rinsehq.com'
  ).replace(/\/$/, '')
}
