import { hasStarterAccess, isFoundingMember, type OrgSubscription } from '../../../packages/core/src/pricing'
export * from '../../../packages/core/src/pricing'
export type SubscriptionStatus = string
export type BillingProvider = string
export type AccessMode = string
export function isVaultAccess(_org: OrgSubscription | null): boolean { return false }
export function isCancelGrace(org: OrgSubscription | null): boolean { return !!org?.cancel_at_period_end && hasStarterAccess(org) }
export function trialDaysLeft(..._args: unknown[]): null { return null }
export function formatTrialLengthLabel(..._args: unknown[]): null { return null }
export function isSubscribedOnStripe(org: OrgSubscription | null): boolean {
 return !!org && !isFoundingMember(org) && ['active', 'past_due'].includes(org.subscription_status) && !!(org.stripe_subscription_id || org.apple_original_transaction_id)
}
export function isOnFreeTier(org: OrgSubscription | null, now = new Date()): boolean { return !!org && !hasStarterAccess(org, now) }
export function billingMenuSubtitle(org: OrgSubscription | null, ..._args: unknown[]): string {
 if (!org) return 'Plan and subscription'
 if (isFoundingMember(org)) return 'Founding · lifetime Starter'
 if (!hasStarterAccess(org)) return 'Free plan'
 return `${org.plan === 'early' ? 'Early · $3/mo' : 'Starter · $6/mo'}${org.cancel_at_period_end ? ' · returns to Free at period end' : ''}`
}
