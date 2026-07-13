import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import type { RecordModel } from 'pocketbase'
import * as auth from '@/src/lib/auth'
import { checkPocketBaseHealth, isPocketBaseConfigured } from '@/src/lib/pocketbase'
import { openOrgOfflineDb } from '@/src/lib/offline/db'
import { getOrganizationId } from '@/src/lib/org'
import { syncTelemetryUser, trackProductEvent } from '@/src/lib/telemetry'

interface AuthContextValue {
  user: RecordModel | null
  loading: boolean
  configured: boolean
  backendHealthy: boolean | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: { email: string; password: string; businessName: string }) => Promise<void>
  signInOAuth: (provider: auth.OAuthProvider) => Promise<void>
  signOut: (options?: { force?: boolean }) => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null)
  const configured = isPocketBaseConfigured()

  const refreshUser = useCallback(() => {
    setUser(auth.getCurrentUser())
  }, [])

  useEffect(() => {
    syncTelemetryUser(user ? { id: String(user.id) } : null)
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (!configured) {
        if (!cancelled) {
          setBackendHealthy(false)
          setLoading(false)
        }
        return
      }

      try {
        const healthy = await Promise.race([
          checkPocketBaseHealth(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 6000)),
        ])
        if (!cancelled) setBackendHealthy(healthy)

        const restored = await Promise.race([
          auth.restoreAuth(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000)),
        ])
        if (restored) {
          const orgId = getOrganizationId()
          if (orgId) {
            try {
              openOrgOfflineDb(orgId)
            } catch {
              // Offline DB is best-effort during boot.
            }
          }
          void auth.refreshAuthOnce().then((ok) => {
            if (!cancelled) setUser(ok ? auth.getCurrentUser() : null)
          })
        }

        if (!cancelled) {
          setUser(restored ? auth.getCurrentUser() : null)
        }
      } catch (err) {
        console.warn('[auth] boot failed:', err instanceof Error ? err.message : err)
        if (!cancelled) {
          setBackendHealthy(false)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [configured])

  useEffect(() => {
    if (!configured) return

    const onAppState = (next: AppStateStatus) => {
      if (next !== 'active') return
      void (async () => {
        const ok = await auth.refreshAuthOnce()
        setUser(ok ? auth.getCurrentUser() : null)
      })()
    }

    const sub = AppState.addEventListener('change', onAppState)
    return () => sub.remove()
  }, [configured])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      backendHealthy,
      signIn: async (email, password) => {
        await auth.signInWithEmail(email, password)
        const orgId = getOrganizationId()
        if (orgId) openOrgOfflineDb(orgId)
        trackProductEvent('auth_signed_in', { method: 'email' })
        refreshUser()
      },
      signUp: async (input) => {
        await auth.signUpWithEmail(input)
        const orgId = getOrganizationId()
        if (orgId) openOrgOfflineDb(orgId)
        // Org creation / entitlement truth is server platform_events (org_created).
        trackProductEvent('auth_signed_up', { method: 'email' })
        refreshUser()
      },
      signInOAuth: async (provider) => {
        await auth.signInWithOAuth(provider)
        const orgId = getOrganizationId()
        if (orgId) openOrgOfflineDb(orgId)
        trackProductEvent('auth_signed_in', { method: provider })
        refreshUser()
      },
      signOut: async (options) => {
        await auth.signOut(options)
        trackProductEvent('auth_signed_out')
        setUser(null)
      },
      refreshUser,
    }),
    [user, loading, configured, backendHealthy, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
