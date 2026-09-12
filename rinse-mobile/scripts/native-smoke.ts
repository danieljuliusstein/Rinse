/**
 * Native logic smoke tests — no device/browser required.
 *
 * Usage (from rinse-mobile/):
 *   npm run native-smoke
 *
 * Covers onboarding, privacy content, profile completion, weather summaries,
 * and settings copy regressions. Does NOT verify visual styling — use
 * screenshots/audit or manual QA for design parity.
 */
import { computeArSummary } from '../src/lib/ar-metrics'
import {
  needsOnboarding,
  normalizeOnboardingStepNumber,
  ONBOARDING_STEP_COUNT,
  resolveOnboardingStep,
  stepSlugFromNumber,
} from '../src/lib/onboarding'
import { computeProfileCompletion } from '../src/lib/profile-completion'
import { PRIVACY_POLICY_SECTIONS, PRIVACY_POLICY_UPDATED } from '../src/lib/privacy-content'
import { DEFAULT_INVOICE_TERMS, type AppSettings } from '../src/lib/settings-store'
import { TOOLS_MENU_ITEMS } from '../src/lib/tools-menu'
import {
  hasWeatherRisk,
  weatherReadinessCompactSummary,
  type WeatherReadinessResult,
} from '../src/lib/weather-readiness'
import { getPrivacyEmail } from '../src/lib/support-config'
import { IAP_STARTER_PRODUCT_ID } from '../src/lib/iap-products'

interface Check {
  label: string
  pass: boolean
  detail?: string
}

const checks: Check[] = []

function check(label: string, pass: boolean, detail?: string): void {
  checks.push({ label, pass, detail })
  const icon = pass ? '✓' : '✗'
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ''}`)
}

function assert(label: string, condition: boolean, detail?: string): void {
  check(label, condition, detail)
}

const BASE_SETTINGS: AppSettings = {
  business_name: '',
  business_phone: '',
  business_email: '',
  business_address: '',
  invoice_terms_footer: DEFAULT_INVOICE_TERMS,
  notifications: {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  },
}

// --- Onboarding ---
assert('onboarding has 4 native steps', ONBOARDING_STEP_COUNT === 4)
assert(
  'needsOnboarding when incomplete',
  needsOnboarding({ ...BASE_SETTINGS, onboarding_completed_at: undefined }),
)
assert(
  'needsOnboarding false when complete',
  !needsOnboarding({ ...BASE_SETTINGS, onboarding_completed_at: '2026-01-01' }),
)
assert('step slug from number 2', stepSlugFromNumber(2) === 'your-invoice')
assert('step slug from number 4', stepSlugFromNumber(4) === 'plans')
assert(
  'resolve step from settings',
  resolveOnboardingStep(null, { ...BASE_SETTINGS, onboarding_step: 3 }) === 'booking',
)
assert('normalize step clamps high', normalizeOnboardingStepNumber(99) === 4)

// --- Privacy ---
assert('privacy policy has sections', PRIVACY_POLICY_SECTIONS.length >= 6)
assert('privacy updated date set', PRIVACY_POLICY_UPDATED.includes('2026'))
assert('privacy email configured', getPrivacyEmail().includes('@'))

// --- IAP product id ---
assert(
  'starter IAP product id set',
  IAP_STARTER_PRODUCT_ID.startsWith('com.rinse.mobile.'),
  IAP_STARTER_PRODUCT_ID,
)

// --- Profile completion ---
const partialProfile = computeProfileCompletion({
  ...BASE_SETTINGS,
  business_phone: '555-0100',
  business_email: '',
  logo_url: '/logo.png',
})
assert('profile percent partial', partialProfile.percent > 0 && partialProfile.percent < 100)
assert('profile next step exists', partialProfile.nextStep?.label === 'Business email')

// --- Weather readiness (home compact banner) ---
const riskWeather: WeatherReadinessResult = {
  status: 'ready',
  rows: [
    {
      kind: 'risk',
      jobId: 'job1',
      primary: 'Rain Thu',
      secondary: 'Job',
      statusLabel: 'Risk',
    },
  ],
}
assert('weather risk detected', hasWeatherRisk(riskWeather))
const compactRisk = weatherReadinessCompactSummary(riskWeather)
assert('compact weather headline', compactRisk?.headline === 'Weather may affect jobs')
assert(
  'compact weather no_jobs shown',
  weatherReadinessCompactSummary({ status: 'no_jobs', rows: [] })?.tone === 'empty',
)
assert(
  'compact weather unresolved shown',
  weatherReadinessCompactSummary({ status: 'unresolved', rows: [] })?.tone === 'unresolved',
)

// --- AR metrics ---
const ar = computeArSummary([
  {
    id: '1',
    invoice_number: 'INV-1',
    job_id: 'j1',
    client_id: 'c1',
    subtotal: 100,
    tip: 0,
    total: 100,
    status: 'sent',
    payments: [],
    amount_paid: 50,
    balance_due: 50,
  },
])
assert('AR open count', ar.openCount === 1 && ar.unpaid === 50)

// --- Copy regressions ---
const invoicingMenu = TOOLS_MENU_ITEMS.find((item) => item.href === '/settings/invoicing')
assert(
  'invoicing menu has no Stripe subtitle',
  Boolean(invoicingMenu?.subtitle && !invoicingMenu.subtitle.toLowerCase().includes('stripe')),
  invoicingMenu?.subtitle,
)

const failed = checks.filter((c) => !c.pass)
console.log('')
console.log(`Native smoke: ${checks.length - failed.length}/${checks.length} passed`)
if (failed.length > 0) {
  process.exitCode = 1
}
