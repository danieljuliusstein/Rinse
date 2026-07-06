'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { fetchPlatformAdminAccess } from '@/lib/admin-api'
import { resetBackend, syncOnReconnect } from '@/lib/api'
import { clearLocalDeviceDataSync } from '@/lib/clear-local-data'
import {
  needsOnboarding,
  onboardingStepUrl,
  resolveOnboardingStep,
} from '@/lib/onboarding'
import {
  authenticatePocketBase,
  clearPocketBaseAuth,
  isPocketBaseAuthenticated,
} from '@/lib/pb-auth'
import { getPocketBase } from '@/lib/pocketbase'
import {
  ADMIN_AUTH,
  ADMIN_HOME,
  isAdminAllowedPath,
  resolveGuestRedirect,
  resolveLogoutHref,
  resolvePostAuthHome,
} from '@/lib/route-lanes'
import { getCurrentOrganizationId } from '@/lib/tenant'
import { isSubscriptionActive, type OrgSubscription } from '@/lib/subscription'

export type LogoutLane = 'admin' | 'operator'

interface AuthContextValue {
  isLoggedIn: boolean
  isAuthenticated: boolean
  isPlatformAdmin: boolean
  platformAdminLoading: boolean
  needsOnboarding: boolean
  subscriptionLapsed: boolean
  subscriptionLoading: boolean
  refreshOnboardingGate: () => Promise<boolean>
  logout: (options?: { lane?: LogoutLane }) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/auth' ||
    pathname === ADMIN_AUTH ||
    pathname === '/welcome' ||
    pathname === '/intro' ||
    pathname === '/privacy' ||
    pathname === '/offline' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/book/') ||
    pathname.startsWith('/embed/') ||
    pathname.startsWith('/demo')
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

  useEffect(() => {
    const pb = getPocketBase()
    if (!pb) return
    return pb.authStore.onChange(() => {
      bumpAuth()
    })
  }, [bumpAuth])

  const ready = mounted
  void authTick

  const isLoggedIn = mounted && isPocketBaseAuthenticated()
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [platformAdminLoading, setPlatformAdminLoading] = useState(false)
  const [needsOnboardingState, setNeedsOnboardingState] = useState(false)
  const [subscriptionLapsed, setSubscriptionLapsed] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const platformAdminCheckedRef = useRef(false)

  const isPublicRoute = isPublicPath(pathname)
  const isOnboardingRoute = isOnboardingPath(pathname)

  useEffect(() => {
    if (!mounted || !isLoggedIn) {
      setIsPlatformAdmin(false)
      setPlatformAdminLoading(false)
      platformAdminCheckedRef.current = false
      return
    }
    if (platformAdminCheckedRef.current) return
    let cancelled = false
    setPlatformAdminLoading(true)
    void (async () => {
      try {
        const admin = await fetchPlatformAdminAccess()
        if (!cancelled) {
          setIsPlatformAdmin(admin)
          platformAdminCheckedRef.current = true
        }
      } catch {
        if (!cancelled) {
          setIsPlatformAdmin(false)
          platformAdminCheckedRef.current = true
        }
      } finally {
        if (!cancelled) setPlatformAdminLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mounted, isLoggedIn, pathname])

  useEffect(() => {
    if (!mounted || !isLoggedIn || isPlatformAdmin || platformAdminLoading) return
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
  }, [mounted, isLoggedIn, isPlatformAdmin, platformAdminLoading, pathname, router])

  useEffect(() => {
    if (
      !mounted ||
      !isLoggedIn ||
      isPlatformAdmin ||
      platformAdminLoading ||
      isPublicPath(pathname) ||
      isOnboardingPath(pathname)
    ) {
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
  }, [mounted, isLoggedIn, isPlatformAdmin, platformAdminLoading, pathname])

  useEffect(() => {
    if (!ready || isLoggedIn) return
    if (isPublicRoute) return
    const adminGuestRedirect = resolveGuestRedirect(pathname)
    if (adminGuestRedirect) {
      safeReplace(router, adminGuestRedirect)
      return
    }
    safeReplace(router, '/welcome')
  }, [ready, isLoggedIn, router, isPublicRoute, pathname])

  useEffect(() => {
    if (!ready || !isLoggedIn || platformAdminLoading) return
    if (pathname !== '/welcome' && pathname !== '/auth' && pathname !== ADMIN_AUTH) return
    const home = resolvePostAuthHome(isPlatformAdmin)
    if (pathname === '/welcome' || pathname === '/auth' || pathname === ADMIN_AUTH) {
      if (pathname === '/auth' && !isPlatformAdmin && needsOnboardingState) {
        safeReplace(router, onboardingStepUrl('business'))
        return
      }
      safeReplace(router, home)
    }
  }, [
    ready,
    isLoggedIn,
    isPlatformAdmin,
    platformAdminLoading,
    needsOnboardingState,
    pathname,
    router,
  ])

  useEffect(() => {
    if (!ready || !isLoggedIn || !isPlatformAdmin || platformAdminLoading) return
    if (isAdminAllowedPath(pathname)) return
    safeReplace(router, ADMIN_HOME)
  }, [ready, isLoggedIn, isPlatformAdmin, platformAdminLoading, pathname, router])

  const syncPocketBaseInBackground = useCallback(() => {
    void (async () => {
      try {
        await authenticatePocketBase()
        if (!isPlatformAdmin) {
          await syncOnReconnect()
        }
      } catch {
        // fall back to local data
      } finally {
        resetBackend()
      }
    })()
  }, [isPlatformAdmin])

  useEffect(() => {
    if (!ready || !isLoggedIn || platformAdminLoading) return
    const timer = window.setTimeout(() => {
      syncPocketBaseInBackground()
    }, 600)
    return () => window.clearTimeout(timer)
  }, [ready, isLoggedIn, platformAdminLoading, syncPocketBaseInBackground])

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

  const logout = useCallback(
    (options?: { lane?: LogoutLane }) => {
      const lane = options?.lane ?? (isPlatformAdmin ? 'admin' : 'operator')
      clearPocketBaseAuth()
      void clearLocalDeviceDataSync()
      resetBackend()
      setIsPlatformAdmin(false)
      bumpAuth()
      safeReplace(router, resolveLogoutHref(lane === 'admin'))
    },
    [router, bumpAuth, isPlatformAdmin],
  )

  const contextValue: AuthContextValue = {
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    isPlatformAdmin,
    platformAdminLoading,
    needsOnboarding: needsOnboardingState,
    subscriptionLapsed,
    subscriptionLoading,
    refreshOnboardingGate,
    logout,
  }

  const needsGuestRedirect = !isLoggedIn && !isPublicRoute
  const adminShellPath = isAdminAllowedPath(pathname)
  const showBlockingRedirect =
    !ready ||
    (isLoggedIn && platformAdminLoading && !adminShellPath) ||
    needsGuestRedirect ||
    (isLoggedIn &&
      !isPlatformAdmin &&
      needsOnboardingState &&
      !isOnboardingRoute &&
      !isPublicRoute)

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
