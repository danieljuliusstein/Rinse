'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { resetBackend, syncOnReconnect } from '@/lib/api'
import { clearLocalDeviceDataSync } from '@/lib/clear-local-data'
import {
  authenticatePocketBase,
  clearPocketBaseAuth,
  isPocketBaseAuthenticated,
} from '@/lib/pb-auth'
import { getCurrentOrganizationId } from '@/lib/tenant'
import { getPocketBase } from '@/lib/pocketbase'
import { isSubscriptionActive, type OrgSubscription } from '@/lib/subscription'
import {
  needsOnboarding,
  onboardingStepUrl,
  resolveOnboardingStep,
} from '@/lib/onboarding'

interface AuthContextValue {
  isLoggedIn: boolean
  isAuthenticated: boolean
  needsOnboarding: boolean
  subscriptionLapsed: boolean
  subscriptionLoading: boolean
  refreshOnboardingGate: () => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/auth' ||
    pathname === '/welcome' ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/book/')
  )
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === '/onboarding'
}

function safeReplace(router: ReturnType<typeof useRouter>, href: string) {
  queueMicrotask(() => {
    try {
      router.replace(href)
    } catch {
      // Router may not be ready during hydration
    }
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authTick, setAuthTick] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const bumpAuth = useCallback(() => setAuthTick((t) => t + 1), [])

  const ready = mounted
  void authTick

  const isLoggedIn = mounted && isPocketBaseAuthenticated()
  const [needsOnboardingState, setNeedsOnboardingState] = useState(false)
  const [subscriptionLapsed, setSubscriptionLapsed] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  const isPublicRoute = isPublicPath(pathname)
  const isOnboardingRoute = isOnboardingPath(pathname)

  useEffect(() => {
    if (!mounted || !isLoggedIn) return
    let cancelled = false
    void (async () => {
      try {
        const { loadSettingsAsync } = await import('@/lib/settings')
        const settings = await loadSettingsAsync()
        if (cancelled) return
        if (settings && needsOnboarding(settings)) {
          setNeedsOnboardingState(true)
          if (!isOnboardingPath(pathname) && !isPublicPath(pathname)) {
            const step = resolveOnboardingStep(null, settings)
            safeReplace(router, onboardingStepUrl(step))
          }
        } else {
          setNeedsOnboardingState(false)
        }
      } catch {
        if (!cancelled) setNeedsOnboardingState(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mounted, isLoggedIn, pathname, router])

  useEffect(() => {
    if (!mounted || !isLoggedIn || isPublicPath(pathname) || isOnboardingPath(pathname)) {
      setSubscriptionLapsed(false)
      setSubscriptionLoading(false)
      return
    }
    let cancelled = false
    setSubscriptionLoading(true)
    void (async () => {
      try {
        const orgId = getCurrentOrganizationId()
        const pb = getPocketBase()
        if (!orgId || !pb?.authStore.isValid) {
          if (!cancelled) {
            setSubscriptionLapsed(false)
            setSubscriptionLoading(false)
          }
          return
        }
        const org = await pb.collection('organizations').getOne(orgId)
        if (cancelled) return
        const sub: OrgSubscription = {
          plan: String(org.plan ?? ''),
          founding_member: org.founding_member === true,
          subscription_status: String(org.subscription_status ?? 'none'),
          trial_ends_at: org.trial_ends_at ? String(org.trial_ends_at) : undefined,
        }
        setSubscriptionLapsed(!isSubscriptionActive(sub))
      } catch {
        if (!cancelled) setSubscriptionLapsed(false)
      } finally {
        if (!cancelled) setSubscriptionLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mounted, isLoggedIn, pathname])

  useEffect(() => {
    if (!ready || isPublicRoute || !isOnboardingRoute || isLoggedIn) return
    safeReplace(router, '/')
  }, [ready, isLoggedIn, router, isPublicRoute, isOnboardingRoute])

  const syncPocketBaseInBackground = useCallback(() => {
    void (async () => {
      try {
        await authenticatePocketBase()
        await syncOnReconnect()
      } catch {
        // fall back to local data
      } finally {
        resetBackend()
      }
    })()
  }, [])

  useEffect(() => {
    if (!ready || !isLoggedIn) return
    syncPocketBaseInBackground()
  }, [ready, isLoggedIn, syncPocketBaseInBackground])

  useEffect(() => {
    if (!ready || !isLoggedIn || pathname !== '/auth') return
    if (needsOnboardingState) {
      safeReplace(router, onboardingStepUrl('business'))
      return
    }
    safeReplace(router, '/')
  }, [ready, isLoggedIn, needsOnboardingState, pathname, router])

  const refreshOnboardingGate = useCallback(async (): Promise<boolean> => {
    try {
      const { loadSettingsAsync } = await import('@/lib/settings')
      const settings = await loadSettingsAsync()
      const stillNeeds = Boolean(settings && needsOnboarding(settings))
      setNeedsOnboardingState(stillNeeds)
      return !stillNeeds
    } catch {
      setNeedsOnboardingState(false)
      return true
    }
  }, [])

  const logout = useCallback(() => {
    clearPocketBaseAuth()
    void clearLocalDeviceDataSync()
    resetBackend()
    bumpAuth()
    safeReplace(router, '/')
  }, [router, bumpAuth])

  const contextValue: AuthContextValue = {
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    needsOnboarding: needsOnboardingState,
    subscriptionLapsed,
    subscriptionLoading,
    refreshOnboardingGate,
    logout,
  }

  const showBlockingRedirect =
    !ready ||
    (isOnboardingRoute && !isLoggedIn) ||
    (isLoggedIn && needsOnboardingState && !isOnboardingRoute && !isPublicRoute)

  return (
    <AuthContext.Provider value={contextValue}>
      {showBlockingRedirect ? (
        <div className="auth-loading-screen">
          <div className="auth-loading-text">{ready ? 'Redirecting…' : 'Loading…'}</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
