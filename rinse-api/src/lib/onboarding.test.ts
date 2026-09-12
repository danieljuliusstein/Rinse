import { describe, expect, it } from 'vitest'
import {
  needsOnboarding,
  normalizeOnboardingSlug,
  normalizeOnboardingStepNumber,
  onboardingStepUrl,
  resolveOnboardingStep,
  stepNumberFromSlug,
  stepSlugFromNumber,
  ONBOARDING_STEP_SLUGS,
} from './onboarding'
import type { AppSettings } from './settings'

const baseSettings: AppSettings = {
  business_name: 'Test Co',
  business_phone: '(404) 555-0100',
  business_email: 'test@example.com',
  business_address: '',
  invoice_terms_footer: 'Due on receipt.',
  notifications: {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  },
}

describe('onboarding', () => {
  it('needs onboarding when completion date is missing', () => {
    expect(needsOnboarding({ ...baseSettings, onboarding_step: 3 })).toBe(true)
    expect(needsOnboarding(null)).toBe(false)
  })

  it('does not need onboarding when completed', () => {
    expect(
      needsOnboarding({
        ...baseSettings,
        onboarding_completed_at: '2026-03-01',
      }),
    ).toBe(false)
  })

  it('maps step numbers and slugs', () => {
    expect(stepSlugFromNumber(1)).toBe('business')
    expect(stepSlugFromNumber(4)).toBe('plans')
    expect(stepNumberFromSlug('your-invoice')).toBe(2)
    expect(stepNumberFromSlug('unknown')).toBe(1)
  })

  it('clamps step numbers to the 4-step range', () => {
    expect(normalizeOnboardingStepNumber(0)).toBe(1)
    expect(normalizeOnboardingStepNumber(4)).toBe(4)
    expect(normalizeOnboardingStepNumber(99)).toBe(4)
    expect(stepSlugFromNumber(4)).toBe('plans')
    expect(stepSlugFromNumber(3)).toBe('booking')
  })

  it('maps legacy URL slugs to your-invoice', () => {
    expect(normalizeOnboardingSlug('services')).toBe('your-invoice')
    expect(normalizeOnboardingSlug('first-invoice')).toBe('your-invoice')
    expect(resolveOnboardingStep('services', { ...baseSettings, onboarding_step: 1 })).toBe('your-invoice')
    expect(resolveOnboardingStep(null, { ...baseSettings, onboarding_step: 4 })).toBe('plans')
    expect(resolveOnboardingStep('bad', { ...baseSettings, onboarding_step: 2 })).toBe('your-invoice')
  })

  it('builds onboarding URLs for each slug', () => {
    for (const slug of ONBOARDING_STEP_SLUGS) {
      expect(onboardingStepUrl(slug)).toBe(`/onboarding?step=${slug}`)
    }
  })
})
