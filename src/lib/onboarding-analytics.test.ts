import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  trackIntroSlideViewed,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed,
} from './onboarding-analytics'

describe('onboarding-analytics', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs viewed events in development', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    trackOnboardingStepViewed('business')
    expect(info).toHaveBeenCalledWith('[onboarding] onboarding_step_viewed', { slug: 'business' })
  })

  it('logs completed events in development', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    trackOnboardingStepCompleted('plans')
    expect(info).toHaveBeenCalledWith('[onboarding] onboarding_step_completed', { slug: 'plans' })
  })

  it('logs intro slide viewed in development', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    trackIntroSlideViewed(1)
    expect(info).toHaveBeenCalledWith('[onboarding] setup_intro_slide_viewed', { slideIndex: 1 })
  })
})
