import {
  hasStarterAccess,
  isFoundingMember,
  isOnFreeTier,
  isSubscribedOnStripe,
  isVaultAccess,
  trialDaysLeft,
  type OrgSubscription,
} from './subscription-types'

export type PremiumAction =
  | 'send_invoice'
  | 'send_quote'
  | 'share_portal'
  | 'export_pdf'
  | 'create_invoice'
  | 'create_quote'
  | 'create_job'
  | 'new_lead'
  | 'receipt_ocr'

export type GateReason = 'full' | 'nudge' | 'lapsed' | 'free' | 'vault' | 'loading'

export const TRIAL_NUDGE_DAYS = 3

/** Actions Free plan may still perform (matches FREE_PLAN marketing). */
export const FREE_TIER_ALLOWED_ACTIONS: ReadonlySet<PremiumAction> = new Set(['create_job'])

/** Vault keeps export so cancel is not a data hostage. */
export const VAULT_ALLOWED_ACTIONS: ReadonlySet<PremiumAction> = new Set(['export_pdf'])

export const PREMIUM_ACTION_LABELS: Record<PremiumAction, string> = {
  send_invoice: 'Sending invoices',
  send_quote: 'Sending quotes',
  share_portal: 'Client portal',
  export_pdf: 'PDF export',
  create_invoice: 'Creating invoices',
  create_quote: 'Quotes',
  create_job: 'Scheduling jobs',
  new_lead: 'Lead pipeline',
  receipt_ocr: 'Receipt scan',
}

const dismissedNudges = new Set<PremiumAction>()
let trialBannerDismissed = false

export function resolveSubscriptionMode(
  org: OrgSubscription | null,
  loading: boolean,
  now = new Date(),
): GateReason {
  if (loading) return 'loading'
  if (!org) return 'full'
  if (isFoundingMember(org)) return 'full'
  if (isVaultAccess(org)) return 'vault'
  if (hasStarterAccess(org, now)) {
    const daysLeft = trialDaysLeft(org, now)
    if (daysLeft != null && daysLeft <= TRIAL_NUDGE_DAYS) return 'nudge'
    return 'full'
  }
  if (org.plan === 'free' || org.access_mode === 'free') return 'free'
  return 'lapsed'
}

export function isSubscriptionLapsed(
  org: OrgSubscription | null,
  loading: boolean,
  now = new Date(),
): boolean {
  const mode = resolveSubscriptionMode(org, loading, now)
  return mode === 'lapsed' || mode === 'free' || mode === 'vault'
}

export function isTrialNudgeDismissed(action: PremiumAction): boolean {
  return dismissedNudges.has(action)
}

export function dismissTrialNudge(action: PremiumAction): void {
  dismissedNudges.add(action)
}

export function isTrialBannerDismissed(): boolean {
  return trialBannerDismissed
}

export function dismissTrialBanner(): void {
  trialBannerDismissed = true
}

export function shouldShowTrialBadge(
  org: OrgSubscription | null,
  loading: boolean,
  daysLeft: number | null,
): boolean {
  if (loading || !org) return false
  if (isFoundingMember(org)) return false
  if (isVaultAccess(org)) return true
  if (isSubscribedOnStripe(org)) return false
  if (org.subscription_status === 'trialing') return true
  if (org.plan === 'free' || isOnFreeTier(org)) return true
  return false
}

export interface GateResolution {
  allowed: boolean
  reason: GateReason
  featureLabel: string
  showPaywall: boolean
  blockAction: boolean
}

export function resolveGate(
  org: OrgSubscription | null,
  loading: boolean,
  action: PremiumAction,
  options: { nudgeDismissed?: boolean; now?: Date } = {},
): GateResolution {
  const featureLabel = PREMIUM_ACTION_LABELS[action]
  const reason = resolveSubscriptionMode(org, loading, options.now)
  const nudgeDismissed = options.nudgeDismissed ?? false

  if (reason === 'loading' || reason === 'full') {
    return {
      allowed: true,
      reason,
      featureLabel,
      showPaywall: false,
      blockAction: false,
    }
  }

  if (reason === 'nudge') {
    if (nudgeDismissed) {
      return {
        allowed: true,
        reason,
        featureLabel,
        showPaywall: false,
        blockAction: false,
      }
    }
    return {
      allowed: false,
      reason,
      featureLabel,
      showPaywall: true,
      blockAction: true,
    }
  }

  if (reason === 'free') {
    if (FREE_TIER_ALLOWED_ACTIONS.has(action)) {
      return {
        allowed: true,
        reason,
        featureLabel,
        showPaywall: false,
        blockAction: false,
      }
    }
    return {
      allowed: false,
      reason: 'free',
      featureLabel,
      showPaywall: true,
      blockAction: true,
    }
  }

  if (reason === 'vault') {
    if (VAULT_ALLOWED_ACTIONS.has(action)) {
      return {
        allowed: true,
        reason,
        featureLabel,
        showPaywall: false,
        blockAction: false,
      }
    }
    return {
      allowed: false,
      reason: 'vault',
      featureLabel,
      showPaywall: true,
      blockAction: true,
    }
  }

  if (reason === 'lapsed') {
    return {
      allowed: false,
      reason,
      featureLabel,
      showPaywall: true,
      blockAction: true,
    }
  }

  return {
    allowed: false,
    reason: 'lapsed',
    featureLabel,
    showPaywall: true,
    blockAction: true,
  }
}
