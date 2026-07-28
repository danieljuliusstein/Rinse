export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'none' | string

export type BillingProvider = 'stripe' | 'apple' | 'none' | string

/** Named access after billing — cancel → vault, never accidental Free forever. */
export type AccessMode = 'full' | 'grace' | 'legacy_readonly' | 'free' | string

export interface OrgSubscription {
  plan: string
  founding_member: boolean
  subscription_status: SubscriptionStatus
  trial_ends_at?: string
  current_period_end?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  billing_provider?: BillingProvider
  apple_original_transaction_id?: string
  access_mode?: AccessMode
  cancel_at_period_end?: boolean
  canceled_at?: string
}

/** Parse PB date fields (YYYY-MM-DD or ISO datetime). */
export function parseSubscriptionEndDate(value: string | undefined | null): Date | null {
  const raw = value?.trim()
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const end = new Date(`${raw}T23:59:59`)
    return Number.isNaN(end.getTime()) ? null : end
  }

  const iso = raw.includes(' ') ? raw.replace(' ', 'T') : raw
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isFoundingMember(org: OrgSubscription): boolean {
  return org.founding_member === true || org.plan === 'founding'
}

/** Pro (or founding) — matches apps/api `isProPlan` for receipt OCR / Pro features. */
export function isProPlan(org: OrgSubscription | null, now = new Date()): boolean {
  if (!org) return false
  if (isFoundingMember(org)) return true
  if (!isSubscriptionActive(org, now)) return false
  return org.plan === 'pro'
}

/** Canceled paid org → read-only vault (not Free). */
export function isVaultAccess(org: OrgSubscription | null): boolean {
  if (!org || isFoundingMember(org)) return false
  if (org.access_mode === 'legacy_readonly') return true
  if (org.plan === 'free' || org.access_mode === 'free') return false
  return String(org.subscription_status ?? '') === 'canceled'
}

/** Cancel scheduled — still entitled until period end. */
export function isCancelGrace(org: OrgSubscription | null): boolean {
  if (!org || isFoundingMember(org) || isVaultAccess(org)) return false
  return org.access_mode === 'grace' || org.cancel_at_period_end === true
}

export function isSubscriptionActive(org: OrgSubscription, now = new Date()): boolean {
  if (isFoundingMember(org)) return true
  if (isVaultAccess(org)) return false
  const status = String(org.subscription_status ?? 'none')
  if (status === 'active' || status === 'past_due') return true
  if (status === 'trialing') {
    const end = parseSubscriptionEndDate(org.trial_ends_at)
    if (!end) return true
    return end >= now
  }
  return org.access_mode === 'grace'
}

export function trialDaysLeft(org: OrgSubscription, now = new Date()): number | null {
  if (isFoundingMember(org)) return null
  if (String(org.subscription_status ?? '') !== 'trialing') return null
  const end = parseSubscriptionEndDate(org.trial_ends_at)
  if (!end) return null
  const diff = end.getTime() - now.getTime()
  if (diff <= 0) return 0
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return Number.isFinite(days) ? days : null
}

/** Paid (or past_due) subscriber on Stripe or Apple — not founding. */
export function isSubscribedOnStripe(org: OrgSubscription | null): boolean {
  if (!org || isFoundingMember(org)) return false
  if (isVaultAccess(org)) return false
  return (
    org.subscription_status === 'active' ||
    org.subscription_status === 'past_due' ||
    Boolean(org.stripe_customer_id) ||
    Boolean(org.apple_original_transaction_id) ||
    org.billing_provider === 'apple' ||
    org.billing_provider === 'stripe'
  )
}

/** Paid Starter / Early (or active trial preview) — unlocks premium actions. */
export function hasStarterAccess(org: OrgSubscription | null, now = new Date()): boolean {
  if (!org) return false
  if (isFoundingMember(org)) return true
  if (isVaultAccess(org)) return false
  // Free pass / Free plan never inherits leftover trial privileges.
  if (org.plan === 'free' || org.access_mode === 'free') return false
  if ((org.plan === 'starter' || org.plan === 'early') && isSubscribedOnStripe(org)) return true
  if (String(org.subscription_status ?? '') === 'trialing' && isSubscriptionActive(org, now)) return true
  if (org.access_mode === 'grace' && isSubscriptionActive(org, now)) return true
  return false
}

/** Permanent free tier or lapsed access — premium actions gated. */
export function isOnFreeTier(org: OrgSubscription | null, now = new Date()): boolean {
  if (!org || isFoundingMember(org)) return false
  if (isVaultAccess(org)) return false
  if (hasStarterAccess(org, now)) return false
  return org.plan === 'free' || org.access_mode === 'free' || !isSubscriptionActive(org, now)
}

/** Settings Billing row / billing card copy when a trial is active. */
export function formatTrialLengthLabel(
  org: OrgSubscription,
  trialLengthDays: number,
  now = new Date(),
): string | null {
  const daysLeft = trialDaysLeft(org, now)
  if (daysLeft == null) return null
  if (daysLeft === 0) {
    return `${trialLengthDays}-day Starter trial ends today`
  }
  return `${trialLengthDays}-day Starter trial · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
}

export function billingMenuSubtitle(
  org: OrgSubscription | null,
  trialLengthDays: number,
  now = new Date(),
): string {
  if (!org) return 'Plan, trial, and subscription'
  if (isFoundingMember(org)) return 'Founding member · lifetime access'
  if (isVaultAccess(org)) return 'Read-only vault · export anytime'
  if (isCancelGrace(org) && org.current_period_end) {
    return `Access until ${org.current_period_end.slice(0, 10)} · then vault`
  }
  const trialLabel = formatTrialLengthLabel(org, trialLengthDays, now)
  if (trialLabel) return trialLabel
  if (org.plan === 'free' || org.access_mode === 'free') return 'Free plan'
  if (org.plan === 'early' && hasStarterAccess(org, now)) return 'Early · $6/mo'
  if (hasStarterAccess(org, now)) return 'Starter'
  return 'Plan, trial, and subscription'
}
