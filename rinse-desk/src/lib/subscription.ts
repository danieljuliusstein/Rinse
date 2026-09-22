import { isSubscriptionActive } from '../../../packages/core/src/pricing'
import { getPocketBase } from './pocketbase'
import { requireOrganizationId } from './org'
import { AppApiError } from './app-api'

/** Mirrors rinse-api `OrgSubscription` used by `requirePremiumSubscription`. */
export type OrgSubscription = {
  plan: string
  founding_member: boolean
  subscription_status: string
  current_period_end?: string
  billing_provider?: string
  stripe_customer_id?: string
}

let cached: OrgSubscription | null = null
let cacheAt = 0
const CACHE_MS = 60_000

export function clearOrgSubscriptionCache() {
  cached = null
  cacheAt = 0
}

export async function fetchOrgSubscription(force = false): Promise<OrgSubscription | null> {
  const now = Date.now()
  if (!force && cached && now - cacheAt < CACHE_MS) return cached

  try {
    const orgId = requireOrganizationId()
    const record = await getPocketBase().collection('organizations').getOne(orgId)
    cached = {
      billing_provider: String(record.billing_provider || ''),
      stripe_customer_id: String(record.stripe_customer_id || ''),
      plan: String(record.plan ?? ''),
      founding_member: record.founding_member === true,
      subscription_status: String(record.subscription_status ?? 'none'),
      current_period_end: record.current_period_end ? String(record.current_period_end) : undefined,
    }
    cacheAt = now
    return cached
  } catch {
    return cached
  }
}

export { isFoundingMember, isSubscriptionActive } from '../../../packages/core/src/pricing'

/**
 * Desk-side precheck before PDF / portal / send.
 * API still enforces; this gives a clear message instead of a raw 402.
 */
export async function assertPremiumAccess(
  feature = 'PDF, portal links, and email',
): Promise<void> {
  const org = await fetchOrgSubscription()
  if (!org) {
    throw new AppApiError(
      'Could not load your organization. Sign in again, then retry.',
      401,
    )
  }
  if (!isSubscriptionActive(org)) {
    throw new AppApiError(
      `Active subscription required for ${feature}. Open Settings → Billing on mobile to upgrade or restore access.`,
      402,
    )
  }
}

export function isPremiumRequiredError(err: unknown): boolean {
  return err instanceof AppApiError && err.status === 402
}
