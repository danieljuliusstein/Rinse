import { Platform } from 'react-native'
import PostHog from 'posthog-react-native'

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim()
const host =
  process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'

/** Opt-in: EXPO_PUBLIC_POSTHOG_DEV=1 forces analytics on during local/dev. */
const forceDevAnalytics = process.env.EXPO_PUBLIC_POSTHOG_DEV === '1'

let client: PostHog | null | undefined

/**
 * Singleton PostHog client. Null when key unset, analytics cannot start, or
 * local/dev (unless EXPO_PUBLIC_POSTHOG_DEV=1). Persistence is always in-memory
 * so missing FileSystem/AsyncStorage never hard-crashes boot.
 */
export function getPostHog(): PostHog | null {
  if (!apiKey) return null
  // Flush network failures call console.error → Expo LogBox red screen on web/dev.
  if (__DEV__ && !forceDevAnalytics) return null
  if (client !== undefined) return client

  try {
    client = new PostHog(apiKey, {
      host,
      // Product usage only — billing/IAP truth stays in platform_events on the server.
      captureAppLifecycleEvents: Platform.OS !== 'web',
      disableSurveys: true,
      persistence: 'memory',
      // Avoid long retry storms when the host is blocked/unreachable.
      fetchRetryCount: 1,
      fetchRetryDelay: 1000,
      preloadFeatureFlags: false,
    })
  } catch (err) {
    console.warn('[posthog] disabled:', err instanceof Error ? err.message : err)
    client = null
  }

  return client
}

export function identifyAnalyticsUser(input: {
  userId: string
  organizationId?: string
}): void {
  const ph = getPostHog()
  if (!ph) return
  try {
    ph.identify(input.userId, {
      organization_id: input.organizationId ?? null,
    })
    if (input.organizationId) {
      ph.group('organization', input.organizationId)
    }
  } catch (err) {
    console.warn('[posthog] identify failed:', err instanceof Error ? err.message : err)
  }
}

export function resetAnalyticsUser(): void {
  try {
    getPostHog()?.reset()
  } catch {
    // ignore
  }
}

/** Soft product events only — never use these as billing entitlement source of truth. */
export function trackProductEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  try {
    getPostHog()?.capture(event, properties)
  } catch {
    // ignore
  }
}
