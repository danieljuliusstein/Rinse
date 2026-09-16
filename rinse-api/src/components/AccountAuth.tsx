'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AppLogo from '@/components/AppLogo'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { SetupRowField } from '@/components/forms'
import { AUTH_PB_NOT_CONFIGURED, formatAuthApiError } from '@/lib/auth-messages'
import { loginWithPassword, requestPasswordReset, clearPocketBaseAuth } from '@/lib/pb-auth'
import { fetchPlatformAdminAccess } from '@/lib/admin-api'
import { isPocketBaseConfigured } from '@/lib/pocketbase'
import { writeCachedPlatformAdmin } from '@/lib/platform-admin-cache'
import { markTourPending } from '@/lib/product-tour'
import { onboardingStepUrl } from '@/lib/onboarding'
import { slugifyBusinessName } from '@/lib/tenant'

interface AccountAuthProps {
  onAuthenticated: (options?: { isSignup?: boolean }) => void
  variant?: 'operator' | 'admin'
}

type AuthMode = 'login' | 'signup' | 'forgot'

export default function AccountAuth({ onAuthenticated, variant = 'operator' }: AccountAuthProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (variant === 'admin') return
    if (searchParams.get('mode') === 'signup') {
      setMode('signup')
    }
  }, [searchParams, variant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (!cloudAuthEnabled) {
        setError(AUTH_PB_NOT_CONFIGURED)
        return
      }

      if (mode === 'forgot') {
        const result = await requestPasswordReset(email)
        if (!result.ok) {
          setError(result.error)
          return
        }
        setInfo(`If an account exists for ${email.trim()}, a reset link is on its way.`)
        return
      }

      if (mode === 'signup' && variant !== 'admin') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, businessName }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(formatAuthApiError(String(data.error ?? 'Signup failed')))
          return
        }
      }

      const ok = await loginWithPassword(email, password)
      if (!ok) {
        setError('Invalid email or password')
        return
      }
      if (variant === 'admin') {
        const isAdmin = await fetchPlatformAdminAccess()
        if (!isAdmin) {
          clearPocketBaseAuth()
          setError('Not a platform admin account')
          return
        }
        writeCachedPlatformAdmin(email.trim(), true)
      }
      if (mode === 'signup') {
        markTourPending()
        onAuthenticated({ isSignup: true })
        router.replace(onboardingStepUrl('business'))
        return
      }
      onAuthenticated()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const slugPreview = businessName.trim() ? slugifyBusinessName(businessName) : ''
  const cloudAuthEnabled = isPocketBaseConfigured()

  const isAdminVariant = variant === 'admin'
  const title = isAdminVariant
    ? 'Rinse HQ'
    : mode === 'login'
      ? 'Sign in'
      : mode === 'signup'
        ? 'Create account'
        : 'Reset password'
  const subtitle = isAdminVariant
    ? 'Platform console sign in'
    : mode === 'login'
      ? 'Sign in to your jobs, clients, and business data'
      : mode === 'signup'
        ? 'Your solo mobile detailing workspace'
        : 'Enter your email and we will send a reset link'

  return (
    <div className="auth-screen setup-flow client-light-root">
      <div className="auth-screen__logo">
        <AppLogo size={48} priority />
      </div>
      <div key={mode} className="auth-step">
        <h1 className="auth-screen__title">{title}</h1>
        <p className="auth-screen__subtitle">{subtitle}</p>

        {!cloudAuthEnabled ? (
          <p className="auth-info auth-info--setup" role="status">
            {AUTH_PB_NOT_CONFIGURED}
          </p>
        ) : null}

        {mode !== 'forgot' && cloudAuthEnabled && !isAdminVariant ? (
          <SocialAuthButtons disabled={loading} onError={setError} />
        ) : null}

        <form className="auth-form page-form" onSubmit={handleSubmit}>
          <div className="ob-field-group">
          {mode === 'signup' ? (
            <SetupRowField
              id="auth-business-name"
              label="Business name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              autoComplete="organization"
            />
          ) : null}
          <SetupRowField
            id="auth-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {mode !== 'forgot' ? (
            <SetupRowField
              id="auth-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'signup' ? 8 : 1}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'signup' ? '8+ characters' : undefined}
            />
          ) : null}
          </div>

          {mode === 'signup' && slugPreview ? (
            <p className="auth-slug-preview">
              Booking link: <strong>/book/{slugPreview}</strong>
            </p>
          ) : null}

          {error ? (
            <p className="auth-error" role="alert" aria-live="assertive">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="auth-info" role="status">
              {info}
            </p>
          ) : null}

          <button type="submit" className="setup-btn-primary" disabled={loading}>
            {loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
          </button>
        </form>

        {mode === 'login' ? (
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setMode('forgot')
              setError('')
              setInfo('')
            }}
          >
            Forgot password?
          </button>
        ) : null}

        {!isAdminVariant ? (
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              if (mode === 'forgot') {
                setMode('login')
              } else {
                setMode(mode === 'login' ? 'signup' : 'login')
              }
              setError('')
              setInfo('')
            }}
          >
            {mode === 'login'
              ? 'New here? Create an account'
              : mode === 'signup'
                ? 'Already have an account? Sign in'
                : 'Back to sign in'}
          </button>
        ) : null}

        {!isAdminVariant ? (
          <p className="auth-legal">
            By signing up, you are agreeing to our <Link href="/terms">Terms</Link>.
          </p>
        ) : null}
      </div>
    </div>
  )
}
