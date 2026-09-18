import { getPocketBase } from './pocketbase'
import { requireOrganizationId } from './org'
import { AppApiError } from './app-api'

/** Mirrors rinse-api `OrgSubscription` used by `requirePremiumSubscription`. */
export type OrgSubscription = {
  plan: string
  founding_member: boolean
  subscription_status: string
  trial_ends_at?: string
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
      plan: String(record.plan ?? ''),
      founding_member: record.founding_member === true,
      subscription_status: String(record.subscription_status ?? 'none'),
      trial_ends_at: record.trial_ends_at ? String(record.trial_ends_at) : undefined,
    }
    cacheAt = now
    return cached
  } catch {
    return cached
  }
}

export function isFoundingMember(org: OrgSubscription): boolean {
  return org.founding_member === true || org.plan === 'founding'
}

/** Same rules as rinse-api `isSubscriptionActive` (portal/PDF gate). */
export function isSubscriptionActive(org: OrgSubscription, now = new Date()): boolean {
  if (isFoundingMember(org)) return true
  const status = String(org.subscription_status ?? 'none')
  if (status === 'active' || status === 'past_due') return true
  if (status === 'trialing') {
    const trialEnd = org.trial_ends_at?.trim()
    if (!trialEnd) return true
    const end = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(trialEnd) ? `${trialEnd}T23:59:59` : trialEnd,
    )
    return !Number.isNaN(end.getTime()) && end >= now
  }
  return false
}

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
