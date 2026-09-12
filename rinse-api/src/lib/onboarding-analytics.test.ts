import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  trackIntroSlideViewed,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed,
} from './onboarding-analytics'

vi.mock('./pb-auth', () => ({
  getAuthFetchHeaders: () => ({ Authorization: 'Bearer test' }),
}))

describe('onboarding-analytics', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs viewed events in development', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    trackOnboardingStepViewed('business')
    expect(info).toHaveBeenCalledWith('[onboarding] onboarding_step_viewed', { slug: 'business' })
    expect(fetchMock).toHaveBeenCalled()
  })

  it('logs completed events in development', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    trackOnboardingStepCompleted('plans')
    expect(info).toHaveBeenCalledWith('[onboarding] onboarding_step_completed', { slug: 'plans' })
  })

  it('logs intro slide viewed in development', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    trackIntroSlideViewed(1)
    expect(info).toHaveBeenCalledWith('[onboarding] setup_intro_slide_viewed', { slide: 2 })
  })
})
