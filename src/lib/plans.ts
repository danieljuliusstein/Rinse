/** Mirror web `src/lib/plans.ts` — keep copy in sync for settings billing UI. */

/** Signup / Starter trial length in days (matches server signup seed). */
export const STARTER_TRIAL_DAYS = 14

/** First N orgs get lifetime Founding ($0). */
export const FOUNDING_SEAT_LIMIT = 20

/** Next N paid orgs after founding get Early ($6/mo). */
export const EARLY_SEAT_LIMIT = 100

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

export const FOUNDING_PLAN = {
  id: 'founding' as const,
  name: 'Founding',
  priceLabel: '$0',
  listPriceLabel: '$12/mo',
  tagline: `Lifetime Starter for the first ${FOUNDING_SEAT_LIMIT} operators.`,
  features: [
    'Everything in Starter — forever',
    'Founding member badge',
    'Locked in at $0 — no card required',
    `Limited to ${FOUNDING_SEAT_LIMIT} seats`,
  ],
} as const

export const EARLY_PLAN = {
  id: 'early' as const,
  name: 'Early',
  priceLabel: '$6/mo',
  listPriceLabel: '$12/mo',
  tagline: `Starter locked at $6/mo for the next ${EARLY_SEAT_LIMIT} after founding.`,
  features: [
    'Everything in Starter',
    'Price locked at $6/mo',
    `Limited to ${EARLY_SEAT_LIMIT} seats after founding`,
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

export const PLAN_OPTIONS = [FREE_PLAN, FOUNDING_PLAN, EARLY_PLAN, STARTER_PLAN] as const

export const PLAN_LABELS: Record<string, string> = {
  founding: FOUNDING_PLAN.name,
  early: EARLY_PLAN.name,
  free: FREE_PLAN.name,
  starter: STARTER_PLAN.name,
}
