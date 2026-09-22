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

const cache = new Map<string, { value: OrgSubscription; at: number }>()
const CACHE_MS = 60_000
export function clearOrgSubscriptionCache() { cache.clear() }

export async function fetchOrgSubscription(force = false, strict = false): Promise<OrgSubscription | null> {
  const orgId = requireOrganizationId()
  const previous = cache.get(orgId)
  if (!force && previous && Date.now() - previous.at < CACHE_MS) return previous.value
  try {
    const record = await getPocketBase().collection('organizations').getOne(orgId, { requestKey: null })
    const value: OrgSubscription = {
      billing_provider: String(record.billing_provider || ''),
      stripe_customer_id: String(record.stripe_customer_id || ''),
      plan: String(record.plan ?? ''),
      founding_member: record.founding_member === true,
      subscription_status: String(record.subscription_status ?? 'none'),
      current_period_end: record.current_period_end ? String(record.current_period_end) : undefined,
    }
    cache.set(orgId, { value, at: Date.now() })
    return value
  } catch (error) {
    if (strict) throw error
    return null
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
      `Active subscription required for ${feature}. Open Settings → Account → Billing to manage your plan.`,
      402,
    )
  }
}

export function isPremiumRequiredError(err: unknown): boolean {
  return err instanceof AppApiError && err.status === 402
}
