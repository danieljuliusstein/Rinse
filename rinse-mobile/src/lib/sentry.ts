import type { ComponentType } from 'react'
import * as Sentry from '@sentry/react-native'
import Constants from 'expo-constants'

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim()

let initialized = false

/**
 * Init once at app boot. No-op when DSN is unset.
 * Dev uses JS-only until a rebuild includes the Sentry native module
 * (avoids white-screen on stale expo-dev-client binaries).
 */
export function initSentry(): void {
  if (initialized || !dsn) return
  initialized = true

  try {
    Sentry.init({
      dsn,
      enabled: true,
      enableNative: !__DEV__,
      environment: __DEV__ ? 'development' : 'production',
      release: `rinse-mobile@${Constants.expoConfig?.version ?? '0.0.0'}`,
      tracesSampleRate: __DEV__ ? 0 : 0.15,
      enableAutoSessionTracking: true,
      sendDefaultPii: false,
    })
  } catch (e) {
    console.warn('[sentry] init failed', e)
    initialized = false
  }
}

export function setSentryUser(user: { id: string; orgId?: string } | null): void {
  if (!dsn || !initialized) return
  try {
    if (!user) {
      Sentry.setUser(null)
      return
    }
    Sentry.setUser({ id: user.id })
    if (user.orgId) Sentry.setTag('organization_id', user.orgId)
  } catch {
    // ignore
  }
}

/** Wrap root only when DSN is configured; never throw on wrap failure. */
export function wrapRoot<P extends Record<string, unknown>>(Component: ComponentType<P>): ComponentType<P> {
  if (!dsn) return Component
  try {
    return Sentry.wrap(Component)
  } catch (e) {
    console.warn('[sentry] wrap failed', e)
    return Component
  }
}

export { Sentry }
