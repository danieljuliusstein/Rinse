import {
  isFoundingMember,
  isSubscriptionActive,
  trialDaysLeft,
  type OrgSubscription,
} from './subscription'

export type PremiumAction =
  | 'send_invoice'
  | 'send_quote'
  | 'share_portal'
  | 'export_pdf'
  | 'create_invoice'
  | 'create_quote'
  | 'create_job'
  | 'new_lead'

export type ProAction = 'embed_widget' | 'custom_report_range' | 'receipt_ocr'

export const PRO_ACTION_LABELS: Record<ProAction, string> = {
  embed_widget: 'Website booking widget',
  custom_report_range: 'Custom report range',
  receipt_ocr: 'Receipt scan',
}

export type GateReason = 'full' | 'nudge' | 'lapsed' | 'loading'

export const PREMIUM_ACTION_LABELS: Record<PremiumAction, string> = {
  send_invoice: 'Sending invoices',
  send_quote: 'Sending quotes',
  share_portal: 'Client portal',
  export_pdf: 'PDF export',
  create_invoice: 'Creating invoices',
  create_quote: 'Quotes',
  create_job: 'Scheduling jobs',
  new_lead: 'Lead pipeline',
}

/** Show paywall nudge when trialing with this many days or fewer left. */
export const TRIAL_NUDGE_DAYS = 3

const NUDGE_STORAGE_PREFIX = 'rinse_paywall_nudge_'
export const TRIAL_BANNER_DISMISS_KEY = 'rinse_trial_banner_dismissed'

export function resolveSubscriptionMode(
  org: OrgSubscription | null,
  loading: boolean,
  now = new Date()
): GateReason {
  if (loading) return 'loading'
  if (!org) return 'full'
  if (isFoundingMember(org)) return 'full'
  if (!isSubscriptionActive(org, now)) return 'lapsed'

  const daysLeft = trialDaysLeft(org, now)
  if (daysLeft != null && daysLeft <= TRIAL_NUDGE_DAYS) return 'nudge'
  return 'full'
}

export function isSubscriptionLapsed(
  org: OrgSubscription | null,
  loading: boolean,
  now = new Date()
): boolean {
  return resolveSubscriptionMode(org, loading, now) === 'lapsed'
}

export function isTrialNudgeDismissed(action: PremiumAction): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(`${NUDGE_STORAGE_PREFIX}${action}`) === '1'
  } catch {
    return false
  }
}

export function dismissTrialNudge(action: PremiumAction): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(`${NUDGE_STORAGE_PREFIX}${action}`, '1')
  } catch {
    /* ignore */
  }
}

export function isTrialBannerDismissed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(TRIAL_BANNER_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissTrialBanner(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(TRIAL_BANNER_DISMISS_KEY, '1')
  } catch {
    /* ignore */
  }
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
  options: { nudgeDismissed?: boolean; now?: Date } = {}
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

  return {
    allowed: false,
    reason: 'lapsed',
    featureLabel,
    showPaywall: true,
    blockAction: true,
  }
}
