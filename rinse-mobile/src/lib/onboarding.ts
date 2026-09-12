import type { AppSettings } from './settings-store'
import { loadSettings, saveSettings } from './settings-store'
import { markTourPending } from './product-tour'

/** URL step slugs — order matches onboarding flow (4 steps). */
export const ONBOARDING_STEP_SLUGS = [
  'business',
  'your-invoice',
  'booking',
  'plans',
] as const

export type OnboardingStepSlug = (typeof ONBOARDING_STEP_SLUGS)[number]

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_SLUGS.length

const LEGACY_SLUG_MAP: Record<string, OnboardingStepSlug> = {
  services: 'your-invoice',
  'invoice-look': 'your-invoice',
  'first-invoice': 'your-invoice',
}

const SLUG_TO_NUMBER: Record<OnboardingStepSlug, number> = {
  business: 1,
  'your-invoice': 2,
  booking: 3,
  plans: 4,
}

const NUMBER_TO_SLUG: Record<number, OnboardingStepSlug> = {
  1: 'business',
  2: 'your-invoice',
  3: 'booking',
  4: 'plans',
}

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepSlug, string> = {
  business: 'Business basics',
  'your-invoice': 'Your invoice',
  booking: 'Booking link',
  plans: 'Your plan',
}

export function normalizeOnboardingStepNumber(step: number | undefined | null): number {
  const n = typeof step === 'number' ? step : 1
  return Math.min(Math.max(n, 1), ONBOARDING_STEP_COUNT)
}

export function normalizeOnboardingSlug(slug: string | null | undefined): OnboardingStepSlug | null {
  if (!slug) return null
  if (ONBOARDING_STEP_SLUGS.includes(slug as OnboardingStepSlug)) {
    return slug as OnboardingStepSlug
  }
  return LEGACY_SLUG_MAP[slug] ?? null
}

export function stepSlugFromNumber(step: number | undefined | null): OnboardingStepSlug {
  const normalized = normalizeOnboardingStepNumber(step)
  return NUMBER_TO_SLUG[normalized] ?? 'business'
}

export function stepNumberFromSlug(slug: string | null | undefined): number {
  const normalized = normalizeOnboardingSlug(slug)
  if (normalized) return SLUG_TO_NUMBER[normalized]
  return 1
}

export function onboardingStepPath(slug: OnboardingStepSlug): string {
  return `/onboarding?step=${slug}`
}

export function needsOnboarding(settings: AppSettings | null | undefined): boolean {
  if (__DEV__ && process.env.EXPO_PUBLIC_DEV_SKIP_ONBOARDING === '1') return false
  if (!settings) return false
  return !settings.onboarding_completed_at
}

export function onboardingProgressIndex(settings: AppSettings | null | undefined): number {
  const step = normalizeOnboardingStepNumber(settings?.onboarding_step)
  return Math.min(Math.max(step, 1), ONBOARDING_STEP_COUNT) - 1
}

export function resolveOnboardingStep(
  urlSlug: string | null | undefined,
  settings: AppSettings | null | undefined,
): OnboardingStepSlug {
  const fromUrl = normalizeOnboardingSlug(urlSlug)
  if (fromUrl) return fromUrl
  return stepSlugFromNumber(settings?.onboarding_step)
}

export async function loadOnboardingProgress(): Promise<AppSettings> {
  return loadSettings()
}

export async function saveOnboardingStep(
  step: number,
  partialSettings: Partial<AppSettings> = {},
): Promise<AppSettings> {
  const current = await loadSettings()
  const normalized = normalizeOnboardingStepNumber(step)
  return saveSettings({
    ...partialSettings,
    onboarding_step: Math.min(Math.max(normalized, 1), ONBOARDING_STEP_COUNT),
  })
}

export async function markFirstInvoiceCreated(): Promise<AppSettings> {
  const current = await loadSettings()
  if (current.onboarding_first_invoice_at) return current
  const today = new Date().toISOString().slice(0, 10)
  return saveSettings({ onboarding_first_invoice_at: today })
}

export interface CompleteOnboardingOptions {
  firstInvoiceCreated?: boolean
}

/** Dev-only: mark onboarding complete and return to the app without the plans step. */
export async function skipOnboardingDev(): Promise<AppSettings> {
  if (!__DEV__) {
    throw new Error('skipOnboardingDev is only available in development')
  }
  const current = await loadSettings()
  const today = new Date().toISOString().slice(0, 10)
  return saveSettings({
    ...current,
    business_phone: current.business_phone?.trim() || '(404) 555-0100',
    onboarding_step: ONBOARDING_STEP_COUNT,
    onboarding_completed_at: today,
  })
}

export async function completeOnboarding(options: CompleteOnboardingOptions = {}): Promise<AppSettings> {
  const current = await loadSettings()
  const today = new Date().toISOString().slice(0, 10)
  if (!current.business_phone?.trim()) {
    throw new Error('Business phone is required to finish setup')
  }
  const settings = await saveSettings({
    onboarding_step: ONBOARDING_STEP_COUNT,
    onboarding_completed_at: today,
    ...(options.firstInvoiceCreated && !current.onboarding_first_invoice_at
      ? { onboarding_first_invoice_at: today }
      : {}),
  })
  await markTourPending()
  return settings
}

export function nextStepSlug(current: OnboardingStepSlug): OnboardingStepSlug | null {
  const idx = ONBOARDING_STEP_SLUGS.indexOf(current)
  if (idx < 0 || idx >= ONBOARDING_STEP_SLUGS.length - 1) return null
  return ONBOARDING_STEP_SLUGS[idx + 1]
}

export function prevStepSlug(current: OnboardingStepSlug): OnboardingStepSlug | null {
  const idx = ONBOARDING_STEP_SLUGS.indexOf(current)
  if (idx <= 0) return null
  return ONBOARDING_STEP_SLUGS[idx - 1]
}
