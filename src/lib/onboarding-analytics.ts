import type { OnboardingStepSlug } from './onboarding'
import { getAuthFetchHeaders } from './pb-auth'

export type OnboardingAnalyticsEvent =
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'setup_intro_slide_viewed'

function trackPlatformEvent(type: OnboardingAnalyticsEvent, metadata: Record<string, unknown>) {
  void fetch('/api/platform/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthFetchHeaders(),
    },
    body: JSON.stringify({ type, metadata }),
  }).catch(() => {
    /* analytics optional */
  })
}

function emitVercel(event: OnboardingAnalyticsEvent, payload: Record<string, unknown>) {
  void import('@vercel/analytics')
    .then(({ track }) => {
      track(event, payload)
    })
    .catch(() => {
      /* analytics optional */
    })
}

function emit(event: OnboardingAnalyticsEvent, metadata: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[onboarding] ${event}`, metadata)
  }
  trackPlatformEvent(event, metadata)
  emitVercel(event, metadata)
}

export function trackOnboardingStepViewed(slug: OnboardingStepSlug) {
  emit('onboarding_step_viewed', { slug })
}

export function trackOnboardingStepCompleted(slug: OnboardingStepSlug) {
  emit('onboarding_step_completed', { slug })
}

export function trackOnboardingCompleted() {
  emit('onboarding_completed', {})
}

export function trackIntroSlideViewed(slideIndex: number) {
  emit('setup_intro_slide_viewed', { slide: slideIndex + 1 })
}
