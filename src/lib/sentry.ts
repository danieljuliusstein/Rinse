import * as Sentry from '@sentry/react-native'
import Constants from 'expo-constants'

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim()

let initialized = false

/** Init once at app boot. No-op when DSN is unset (local / CI without secrets). */
export function initSentry(): void {
  if (initialized || !dsn) return
  initialized = true

  Sentry.init({
    dsn,
    enabled: true,
    environment: __DEV__ ? 'development' : 'production',
    release: `rinse-mobile@${Constants.expoConfig?.version ?? '0.0.0'}`,
    tracesSampleRate: __DEV__ ? 0 : 0.15,
    enableAutoSessionTracking: true,
    // Avoid PII in breadcrumbs by default
    sendDefaultPii: false,
  })
}

export function setSentryUser(user: { id: string; orgId?: string } | null): void {
  if (!dsn) return
  if (!user) {
    Sentry.setUser(null)
    return
  }
  Sentry.setUser({ id: user.id })
  if (user.orgId) Sentry.setTag('organization_id', user.orgId)
}

export { Sentry }
