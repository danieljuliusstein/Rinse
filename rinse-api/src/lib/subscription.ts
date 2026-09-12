export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'none' | string

export interface OrgSubscription {
  plan: string
  founding_member: boolean
  subscription_status: SubscriptionStatus
  trial_ends_at?: string
  current_period_end?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
}

export function isFoundingMember(org: OrgSubscription): boolean {
  return org.founding_member === true || org.plan === 'founding'
}

export function isSubscriptionActive(org: OrgSubscription, now = new Date()): boolean {
  if (isFoundingMember(org)) return true
  const status = String(org.subscription_status ?? 'none')
  if (status === 'active' || status === 'past_due') return true
  if (status === 'trialing') {
    const trialEnd = org.trial_ends_at?.trim()
    if (!trialEnd) return true
    const end = new Date(trialEnd + 'T23:59:59')
    return end >= now
  }
  return false
}

export function trialDaysLeft(org: OrgSubscription, now = new Date()): number | null {
  if (isFoundingMember(org)) return null
  if (String(org.subscription_status ?? '') !== 'trialing') return null
  const trialEnd = org.trial_ends_at?.trim()
  if (!trialEnd) return null
  const end = new Date(trialEnd + 'T23:59:59')
  const diff = end.getTime() - now.getTime()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isProPlan(org: OrgSubscription | null, now = new Date()): boolean {
  if (!org) return false
  if (isFoundingMember(org)) return true
  if (!isSubscriptionActive(org, now)) return false
  return org.plan === 'pro'
}
