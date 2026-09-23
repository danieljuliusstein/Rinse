/** Product policy. Amounts are USD cents; storefronts display their localized price. */
export const FREE_ACTIVE_JOB_LIMIT = 5
export const EARLY_SEAT_LIMIT = 100
export const FOUNDING_SEAT_LIMIT = 20
export const PRICES = { free: 0, starter: 600, early: 300, founding: 0 } as const
export const ACTIVE_JOB_STATUSES = ['scheduled', 'in_progress'] as const
export function countsTowardActiveJobLimit(status: string): boolean {
  return (ACTIVE_JOB_STATUSES as readonly string[]).includes(status)
}
export interface OrgSubscription {
  plan: string
  founding_member: boolean
  subscription_status: string
  current_period_end?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  billing_provider?: string
  apple_original_transaction_id?: string
  access_mode?: string
  cancel_at_period_end?: boolean
  canceled_at?: string
  trial_ends_at?: string
}
export function isFoundingMember(org: OrgSubscription): boolean {
  return org.founding_member === true && org.plan === 'founding'
}
export function parseSubscriptionEndDate(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(value.replace(' ', 'T'))
  return Number.isFinite(date.getTime()) ? date : null
}
export function hasStarterAccess(org: OrgSubscription | null, now = new Date()): boolean {
  if (!org) return false
  if (isFoundingMember(org)) return true
  if (!['starter', 'early'].includes(org.plan) || org.subscription_status !== 'active') return false
  const end = parseSubscriptionEndDate(org.current_period_end)
  return !!end && end > now
}
export const isSubscriptionActive = hasStarterAccess
/** Paid plan access (display name: Pro; billing id remains `starter`). */
export const isProPlan = hasStarterAccess
export const FREE_ACTIONS = ['create_job', 'create_invoice', 'send_invoice', 'invoice_pdf', 'invoice_payment'] as const
export function canPerform(org: OrgSubscription | null, action: string, now = new Date()): boolean {
  return !!org && ((FREE_ACTIONS as readonly string[]).includes(action) || hasStarterAccess(org, now))
}
export function canActivateJob(org: OrgSubscription, activeCount: number, wasActive: boolean, status: string): boolean {
  return !countsTowardActiveJobLimit(status) || wasActive || hasStarterAccess(org) || activeCount < FREE_ACTIVE_JOB_LIMIT
}
export const FREE_PLAN = { id: 'free', name: 'Free', priceLabel: '$0', tagline: 'Get organized and get paid.', features: ['Clients & vehicle profiles', 'Up to 5 active jobs', 'Basic scheduling & job notes', 'Invoices, invoice PDFs & customer payments', 'Business profile & settings'] } as const
export const STARTER_PLAN = { id: 'starter', name: 'Pro', priceLabel: '$6/mo', listPriceLabel: '$6/mo', tagline: 'More tools as your detailing business grows.', features: ['Unlimited active jobs', 'Public booking link and website booking widget', 'Lead pipeline, quotes and full client portal', 'Inventory & supplies with low-stock alerts', 'Expenses, overhead, revenue and profit reports', 'Your logo and accent on booking and portal pages', 'Email auto-messages and editable templates', 'Receipt scan and custom report ranges', 'Priority email support'] } as const
export const EARLY_PLAN = { id: 'early', name: 'Early', priceLabel: '$3/mo', listPriceLabel: '$6/mo', tagline: 'Pro at $3/month for the first 100 qualifying paying operators, while continuously subscribed.', features: STARTER_PLAN.features } as const
export const FOUNDING_PLAN = { id: 'founding', name: 'Founding', priceLabel: '$0', listPriceLabel: '$6/mo', tagline: 'Lifetime Pro, personally granted by the owner.', features: ['Lifetime Pro access', 'Founding member badge'] } as const
export const PLAN_OPTIONS = [FREE_PLAN, STARTER_PLAN] as const
export const PLAN_LABELS: Record<string, string> = { free: 'Free', starter: 'Pro', early: 'Early', founding: 'Founding' }
