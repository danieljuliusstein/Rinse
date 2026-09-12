import { refreshAuthOnce } from './auth'
import { requireOrganizationId } from './org'

/** Refresh auth token then resolve org — use before PocketBase writes. */
export async function requireOrganizationIdForWrite(): Promise<string> {
  await refreshAuthOnce()
  return requireOrganizationId()
}
