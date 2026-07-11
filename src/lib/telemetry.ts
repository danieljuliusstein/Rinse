import { getOrganizationId } from '@/src/lib/org'
import {
  identifyAnalyticsUser,
  resetAnalyticsUser,
  trackProductEvent,
} from '@/src/lib/posthog'
import { setSentryUser } from '@/src/lib/sentry'

/** Sync Sentry + PostHog identity after auth changes. No emails in analytics props. */
export function syncTelemetryUser(user: { id: string } | null): void {
  if (!user) {
    setSentryUser(null)
    resetAnalyticsUser()
    return
  }
  const orgId = getOrganizationId() ?? undefined
  setSentryUser({ id: user.id, orgId })
  identifyAnalyticsUser({ userId: user.id, organizationId: orgId })
}

export { trackProductEvent }
