import { canPerform, hasStarterAccess as starterAccess } from '../../../packages/core/src/pricing'
import {
  hasStarterAccess,
  isFoundingMember,
  isOnFreeTier,
  isProPlan,
  isSubscribedOnStripe,
  isVaultAccess,
  trialDaysLeft,
  type OrgSubscription,
} from './subscription-types'

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
  | 'receipt_ocr'

/** Actions that require Pro (matches apps/api `ProAction` / `requireProPlan`). */
export const PRO_REQUIRED_ACTIONS: ReadonlySet<PremiumAction> = new Set([])

export type GateReason = 'full' | 'nudge' | 'lapsed' | 'free' | 'vault' | 'loading'

export const TRIAL_NUDGE_DAYS = 3

/** Actions Free plan may still perform (matches FREE_PLAN marketing). */
export const FREE_TIER_ALLOWED_ACTIONS: ReadonlySet<PremiumAction> = new Set(['create_job', 'create_invoice', 'send_invoice', 'invoice_pdf', 'invoice_payment'])

/** Vault keeps export so cancel is not a data hostage. */
export const VAULT_ALLOWED_ACTIONS: ReadonlySet<PremiumAction> = new Set(['export_pdf'])

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
  receipt_ocr: 'Receipt scan',
}

const dismissedNudges = new Set<PremiumAction>()
let trialBannerDismissed = false

export function resolveSubscriptionMode(org: OrgSubscription | null, loading: boolean, now = new Date()): GateReason {
  if (loading || !org) return 'loading'
  return starterAccess(org, now) ? 'full' : 'free'
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

export function shouldShowTrialBadge(..._args: unknown[]): boolean { return false }

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
