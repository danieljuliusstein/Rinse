import PostHog from 'posthog-react-native'

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim()
const host =
  process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'

let client: PostHog | null = null

/** Singleton PostHog client. Null when key unset. */
export function getPostHog(): PostHog | null {
  if (!apiKey) return null
  if (!client) {
    client = new PostHog(apiKey, {
      host,
      // Product usage only — billing/IAP truth stays in platform_events on the server.
      captureAppLifecycleEvents: true,
      disableSurveys: true,
    })
  }
  return client
}

export function identifyAnalyticsUser(input: {
  userId: string
  organizationId?: string
}): void {
  const ph = getPostHog()
  if (!ph) return
  ph.identify(input.userId, {
    organization_id: input.organizationId ?? null,
  })
  if (input.organizationId) {
    ph.group('organization', input.organizationId)
  }
}

export function resetAnalyticsUser(): void {
  getPostHog()?.reset()
}

/** Soft product events only — never use these as billing entitlement source of truth. */
export function trackProductEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  getPostHog()?.capture(event, properties)
}
