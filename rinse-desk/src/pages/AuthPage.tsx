import { useState, type FormEvent } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import type { OAuthProvider } from '@/lib/auth'
import { RinseLockup } from '@/components/brand/RinseLogo'
import { BRAND } from '@/lib/brand-assets'

type Mode = 'signin' | 'signup'

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3-2.33Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 17 20" fill="currentColor" aria-hidden>
      <path d="M13.9 10.6c0-2.15 1.76-3.18 1.84-3.23-1-1.47-2.57-1.67-3.13-1.7-1.33-.13-2.6.78-3.27.78-.68 0-1.72-.76-2.83-.74-1.46.02-2.8.85-3.55 2.15-1.51 2.63-.39 6.51 1.09 8.64.72 1.04 1.58 2.21 2.71 2.17 1.09-.04 1.5-.7 2.82-.7 1.31 0 1.69.7 2.84.68 1.18-.02 1.92-1.06 2.63-2.11a9.24 9.24 0 0 0 1.19-2.44c-.03-.01-2.27-.87-2.29-3.45ZM11.74 4.02c.6-.72 1-1.73.89-2.73-.86.04-1.9.58-2.52 1.3-.55.63-1.04 1.66-.91 2.63.95.08 1.92-.48 2.54-1.2Z" />
    </svg>
  )
}

export default function AuthPage() {
  const { signIn, signUp, signInWithOAuth, backendHealthy } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'form' | OAuthProvider | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (password !== passwordConfirm) {
        setError('Passwords do not match.')
        return
      }
      if (!businessName.trim()) {
        setError('Business name is required.')
        return
      }
    }

    setBusy('form')
    try {
      if (mode === 'signup') {
        await signUp({ email, password, businessName })
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  function onOAuth(provider: OAuthProvider) {
    setError(null)
    setBusy(provider)
    signInWithOAuth(provider, mode === 'signup' ? { businessName: businessName.trim() || undefined } : undefined)
      .catch((err) => {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === 'object' && err && 'message' in err
              ? String((err as { message: unknown }).message)
              : `Could not sign in with ${provider}`
        setError(msg || `Could not sign in with ${provider}`)
      })
      .finally(() => setBusy(null))
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden bg-white">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(34,197,94,0.1), transparent)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 20%, black, transparent)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl border border-black/8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] p-8 space-y-6">
          <div className="space-y-3">
            <RinseLockup height={28} />
            <div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-sm text-black/40 mt-0.5">
                {mode === 'signup' ? `Start your free trial of ${BRAND.product}` : `Sign in to ${BRAND.product}`}
              </p>
            </div>
          </div>

          {backendHealthy === false && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              PocketBase health check failed. You can still try signing in.
            </p>
          )}
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onOAuth('google')}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-black/12 text-sm font-semibold text-neutral-900 hover:bg-black/2 transition-colors disabled:opacity-50"
            >
              <GoogleIcon />
              {busy === 'google' ? 'Connecting…' : 'Continue with Google'}
            </button>
            <button
              type="button"
              onClick={() => onOAuth('apple')}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-black/12 text-sm font-semibold text-neutral-900 hover:bg-black/2 transition-colors disabled:opacity-50"
            >
              <AppleIcon />
              {busy === 'apple' ? 'Connecting…' : 'Continue with Apple'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-black/8" />
            <span className="text-[11px] font-medium text-black/30 uppercase tracking-wide">or continue with email</span>
            <div className="h-px flex-1 bg-black/8" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-black/55">Business name</span>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full text-sm border border-black/12 rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="Shine Theory Detailing"
                />
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-black/55">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-black/12 rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="you@shop.com"
                autoComplete="username"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-black/55">Password</span>
              <input
                type="password"
                required
                minLength={mode === 'signup' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm border border-black/12 rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </label>

            {mode === 'signup' && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-black/55">Confirm password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full text-sm border border-black/12 rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={busy !== null}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-colors disabled:opacity-60"
            >
              {busy === 'form'
                ? mode === 'signup'
                  ? 'Creating account…'
                  : 'Signing in…'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-black/40">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
          </p>

          <p className="text-center text-xs text-black/40">
            By signing up, you are agreeing to our{' '}
            <a
              href="https://app.rinsehq.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-600 hover:underline"
            >
              Terms
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
