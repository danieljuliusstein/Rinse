/** Mirror web `src/lib/plans.ts` — keep copy in sync for settings billing UI. */

/** Signup / Starter trial length in days (matches server signup seed). */
export const STARTER_TRIAL_DAYS = 14

export const FREE_PLAN = {
  id: 'free' as const,
  name: 'Free',
  priceLabel: '$0',
  tagline: 'Organize clients and jobs without a subscription.',
  features: [
    'Clients & vehicle profiles',
    'Up to 5 active jobs',
    'Basic scheduling & job notes',
    'Business profile & settings',
    'Upgrade anytime to unlock booking, billing, and pipeline',
  ],
} as const

export const STARTER_PLAN = {
  id: 'starter' as const,
  name: 'Starter',
  listPriceLabel: '$12/mo',
  priceLabel: '$12/mo',
  tagline: 'Everything to run a solo mobile detailing business.',
  features: [
    'Public booking link — clients pick a service, date, and time',
    'Lead pipeline — capture inquiries before they become clients',
    'Jobs — schedule work, track status, and log revenue',
    'Clients, quotes, and invoices in one place',
    'Client portal — share status updates and collect payment online',
    'Inventory & supplies with low-stock alerts',
    'Business expenses and monthly overhead tracking',
    'Revenue reports and job profit on the Business tab',
    'Your logo and accent color on booking and portal pages',
    'Website booking widget with calendar embed',
    'Email auto-messages + editable templates',
    'Receipt scan — draft line items from photos',
    'Advanced Business reports and custom date ranges',
    'Priority email support',
  ],
} as const

export const PLAN_OPTIONS = [FREE_PLAN, STARTER_PLAN] as const

export const PLAN_LABELS: Record<string, string> = {
  founding: 'Founding',
  free: FREE_PLAN.name,
  starter: STARTER_PLAN.name,
}
