/** Set NEXT_PUBLIC_LAUNCH_PRICING=true while STRIPE_LAUNCH_COUPON_ID is active in checkout. */
export const LAUNCH_PRICING_ACTIVE = process.env.NEXT_PUBLIC_LAUNCH_PRICING === 'true'

export const STARTER_PLAN = {
  id: 'starter' as const,
  name: 'Starter',
  listPriceLabel: '$29/mo',
  priceLabel: LAUNCH_PRICING_ACTIVE ? '$19/mo' : '$29/mo',
  launchNote: LAUNCH_PRICING_ACTIVE
    ? 'Launch pricing — locked at $19/mo for early subscribers.'
    : undefined,
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
    '14-day free trial — no card required to start',
  ],
} as const

export const PRO_PLAN = {
  id: 'pro' as const,
  name: 'Pro',
  priceLabel: '$49/mo',
  tagline: 'For operators ready to scale volume and automation.',
  features: [
    'Everything in Starter',
    'Priority email support',
    'Advanced Business reports and custom date ranges',
    'Website booking widget with calendar embed',
    'Email auto-messages + editable templates',
    'Receipt scan — draft line items from photos',
    'Early access to new features',
  ],
  footnote: 'SMS auto-messages — coming soon',
  comingSoon: process.env.NEXT_PUBLIC_PRO_PLAN_ENABLED !== 'true',
} as const

export const PLAN_OPTIONS = [STARTER_PLAN, PRO_PLAN] as const
