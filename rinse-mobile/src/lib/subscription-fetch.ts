import type { OrgSubscription } from './subscription-types'
import { getPocketBase } from './pocketbase'
import { requireOrganizationId } from './org'

let cachedOrg: OrgSubscription | null = null
let cacheAt = 0
const CACHE_MS = 60_000

export async function fetchOrgSubscription(force = false): Promise<OrgSubscription | null> {
  const now = Date.now()
  if (!force && cachedOrg && now - cacheAt < CACHE_MS) return cachedOrg

  try {
    const orgId = requireOrganizationId()
    const pb = getPocketBase()
    const record = await pb.collection('organizations').getOne(orgId)
    cachedOrg = {
      plan: String(record.plan ?? 'none'),
      founding_member: Boolean(record.founding_member),
      subscription_status: String(record.subscription_status ?? 'none'),
      trial_ends_at: record.trial_ends_at ? String(record.trial_ends_at) : undefined,
      current_period_end: record.current_period_end ? String(record.current_period_end) : undefined,
      stripe_customer_id: record.stripe_customer_id ? String(record.stripe_customer_id) : undefined,
      stripe_subscription_id: record.stripe_subscription_id
        ? String(record.stripe_subscription_id)
        : undefined,
      billing_provider: record.billing_provider ? String(record.billing_provider) : undefined,
      apple_original_transaction_id: record.apple_original_transaction_id
        ? String(record.apple_original_transaction_id)
        : undefined,
      access_mode: record.access_mode ? String(record.access_mode) : undefined,
      cancel_at_period_end: Boolean(record.cancel_at_period_end),
      canceled_at: record.canceled_at ? String(record.canceled_at) : undefined,
    }
    cacheAt = now
    return cachedOrg
  } catch {
    return cachedOrg
  }
}

export function clearOrgSubscriptionCache(): void {
  cachedOrg = null
  cacheAt = 0
}

/**
 * Convert the org to Free (onboarding “Continue on Free”).
 * Clears trial so leftover trialing status cannot unlock Starter features.
 */
export async function activateFreePlan(): Promise<OrgSubscription | null> {
  const orgId = requireOrganizationId()
  const pb = getPocketBase()
  await pb.collection('organizations').update(orgId, {
    plan: 'free',
    subscription_status: 'none',
    trial_ends_at: '',
    access_mode: 'free',
    cancel_at_period_end: false,
    canceled_at: '',
  })
  clearOrgSubscriptionCache()
  return fetchOrgSubscription(true)
}

export async function isOfflineWritesEnabled(): Promise<boolean> {
  if (process.env.EXPO_PUBLIC_OFFLINE_ENABLED === '0') return false

  try {
    const orgId = requireOrganizationId()
    const pb = getPocketBase()
    const record = await pb.collection('organizations').getOne(orgId)
    if (record.native_offline_enabled === false) return false
  } catch {
    // Default enabled for v1 dogfood when field missing or unreachable.
  }

  return true
}
