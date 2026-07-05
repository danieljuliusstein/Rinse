import type { OnboardingStepSlug } from './onboarding'

export type OnboardingAnalyticsEvent =
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'setup_intro_slide_viewed'

function emit(event: OnboardingAnalyticsEvent, slug: OnboardingStepSlug) {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[onboarding] ${event}`, { slug })
  }

  void import('@vercel/analytics')
    .then(({ track }) => {
      track(event, { slug })
    })
    .catch(() => {
      /* analytics optional */
    })
}

export function trackOnboardingStepViewed(slug: OnboardingStepSlug) {
  emit('onboarding_step_viewed', slug)
}

export function trackOnboardingStepCompleted(slug: OnboardingStepSlug) {
  emit('onboarding_step_completed', slug)
}

export function trackIntroSlideViewed(slideIndex: number) {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[onboarding] setup_intro_slide_viewed', { slideIndex })
  }
  void import('@vercel/analytics')
    .then(({ track }) => {
      track('setup_intro_slide_viewed', { slide: slideIndex + 1 })
    })
    .catch(() => {
      /* analytics optional */
    })
}
