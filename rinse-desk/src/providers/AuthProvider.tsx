import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RecordModel } from 'pocketbase'
import * as auth from '@/lib/auth'
import type { OAuthProvider } from '@/lib/auth'
import { checkPocketBaseHealth } from '@/lib/pocketbase'

interface AuthContextValue {
  user: RecordModel | null
  loading: boolean
  backendHealthy: boolean | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: { email: string; password: string; businessName: string }) => Promise<void>
  signInWithOAuth: (provider: OAuthProvider, opts?: { businessName?: string }) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null)

  const refreshUser = useCallback(() => {
    setUser(auth.getCurrentUser())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const healthy = await checkPocketBaseHealth()
      if (!cancelled) setBackendHealthy(healthy)
      const restored = auth.restoreAuth()
      if (restored) {
        void auth.refreshAuth().then(() => {
          if (!cancelled) setUser(auth.getCurrentUser())
        })
      }
      if (!cancelled) {
        setUser(restored ? auth.getCurrentUser() : null)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await auth.signInWithEmail(email, password)
    setUser(auth.getCurrentUser())
  }, [])

  const signUp = useCallback(async (input: { email: string; password: string; businessName: string }) => {
    await auth.signUpWithEmail(input)
    setUser(auth.getCurrentUser())
  }, [])

  const signInWithOAuth = useCallback(async (provider: OAuthProvider, opts?: { businessName?: string }) => {
    await auth.signInWithOAuth(provider, opts)
    setUser(auth.getCurrentUser())
  }, [])

  const signOut = useCallback(async () => {
    await auth.signOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, backendHealthy, signIn, signUp, signInWithOAuth, signOut, refreshUser }),
    [user, loading, backendHealthy, signIn, signUp, signInWithOAuth, signOut, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
