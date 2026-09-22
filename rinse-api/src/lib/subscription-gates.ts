import { canPerform, hasStarterAccess as starterAccess } from '../../../packages/core/src/pricing'
import {
  isFoundingMember,
  isSubscriptionActive,
  trialDaysLeft,
  type OrgSubscription,
} from './subscription'

export type PremiumAction =
  | 'invoice_pdf'
  | 'invoice_payment'
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
  invoice_pdf: 'Invoice PDF',
  invoice_payment: 'Invoice payment link',
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

export function resolveSubscriptionMode(org: OrgSubscription | null, loading: boolean, now = new Date()): GateReason {
  if (loading || !org) return 'loading'
  return starterAccess(org, now) ? 'full' : 'lapsed'
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

export function resolveGate(org: OrgSubscription | null, loading: boolean, action: PremiumAction, options: { nudgeDismissed?: boolean; now?: Date } = {}): GateResolution {
  const allowed = !loading && canPerform(org, action, options.now)
  return { allowed, reason: resolveSubscriptionMode(org, loading, options.now), featureLabel: PREMIUM_ACTION_LABELS[action], showPaywall: !allowed && !loading, blockAction: !allowed }
}
