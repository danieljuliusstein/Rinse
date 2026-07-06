import type { AppSettings } from './settings'
import { DEFAULT_INVOICE_TERMS } from './settings'
import type { Package } from './types'

export const DEMO_SETUP_SETTINGS: AppSettings = {
  business_name: 'Summit Detail',
  business_phone: '(404) 555-0142',
  business_email: 'hello@summitdetail.com',
  business_address: 'Atlanta, GA',
  invoice_terms_footer: DEFAULT_INVOICE_TERMS,
  notifications: {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  },
  appearance: 'light',
  invoice_template: 'rinse',
  accent_color: '#22c55e',
  logo_url: '/logo.png',
  onboarding_step: 1,
}

export const DEMO_SETUP_PACKAGES: Package[] = [
  {
    id: 'demo-full',
    name: 'Full detail',
    base_price: 185,
    description: 'Sedan · mobile',
    expected_return_days: 90,
    duration_minutes: 180,
    active: true,
  },
  {
    id: 'demo-interior',
    name: 'Interior only',
    base_price: 95,
    description: 'Sedan · mobile',
    expected_return_days: 60,
    duration_minutes: 90,
    active: true,
  },
  {
    id: 'demo-wash',
    name: 'Maintenance wash',
    base_price: 65,
    description: 'Sedan · mobile',
    expected_return_days: 30,
    duration_minutes: 60,
    active: true,
  },
]

export const DEMO_BOOKING_SLUG = 'summit-detail'

export const SETUP_DEMO_SCREENS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'intro', label: 'Intro' },
  { id: 'auth', label: 'Auth' },
  { id: 'business', label: 'Business' },
  { id: 'your-invoice', label: 'Invoice' },
  { id: 'booking', label: 'Booking' },
  { id: 'plans', label: 'Plans' },
  { id: 'done', label: 'Done' },
] as const

export type SetupDemoScreenId = (typeof SETUP_DEMO_SCREENS)[number]['id']

const LINEAR_FLOW: SetupDemoScreenId[] = [
  'welcome',
  'intro',
  'auth',
  'business',
  'your-invoice',
  'booking',
  'plans',
  'done',
]

export function nextSetupDemoScreen(current: SetupDemoScreenId): SetupDemoScreenId | null {
  const idx = LINEAR_FLOW.indexOf(current)
  if (idx < 0 || idx >= LINEAR_FLOW.length - 1) return null
  return LINEAR_FLOW[idx + 1] ?? null
}

export function prevSetupDemoScreen(current: SetupDemoScreenId): SetupDemoScreenId | null {
  const idx = LINEAR_FLOW.indexOf(current)
  if (idx <= 0) return null
  return LINEAR_FLOW[idx - 1] ?? null
}
