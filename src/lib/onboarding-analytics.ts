import type { OnboardingStepSlug } from './onboarding'

export type OnboardingAnalyticsEvent = 'onboarding_step_viewed' | 'onboarding_step_completed'

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
