import { useEffect, useState, type ReactNode } from 'react'
import { MailCheck, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { refreshAuth } from '@/lib/auth'
import { RinseLockup } from '@/components/brand/RinseLogo'

function AuthShell({ children }: { children: ReactNode }) {
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
        <div className="bg-white rounded-2xl border border-black/8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] p-8 space-y-6 text-center">
          <RinseLockup height={28} className="mx-auto" />
          {children}
        </div>
      </div>
    </div>
  )
}

const RESEND_COOLDOWN_S = 30

export default function VerifyEmailPage() {
  const { user, resendVerification, signOut } = useAuth()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'checking'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const email = (user as { email?: string } | null)?.email ?? 'your email'

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function onResend() {
    setStatus('sending')
    setError(null)
    try {
      await resendVerification()
      setStatus('sent')
      setCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Could not send verification email')
    }
  }

  async function onCheckAgain() {
    setStatus('checking')
    setError(null)
    try {
      await refreshAuth()
      // Gate re-renders automatically once emailVerified flips true.
    } finally {
      setStatus('idle')
    }
  }

  return (
    <AuthShell>
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto">
        <MailCheck size={26} className="text-brand-600" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Verify your email</h1>
        <p className="text-sm text-black/45 mt-1.5 leading-relaxed">
          We sent a verification link to <span className="font-semibold text-neutral-900">{email}</span>. Click it to
          activate your account, then come back here.
        </p>
      </div>

      {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {status === 'sent' && (
        <p className="text-xs text-brand-700 bg-brand-500/8 border border-brand-500/20 rounded-lg px-3 py-2">
          Verification email sent — check your inbox (and spam folder).
        </p>
      )}

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onCheckAgain}
          disabled={status === 'checking'}
          className="w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-colors disabled:opacity-60"
        >
          {status === 'checking' ? 'Checking…' : "I've verified — Continue"}
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={status === 'sending' || cooldown > 0}
          className="w-full py-2.5 text-sm font-semibold text-neutral-900 rounded-xl border border-black/12 hover:bg-black/2 transition-colors disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend available in ${cooldown}s` : status === 'sending' ? 'Sending…' : 'Resend verification email'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => void signOut()}
        className="text-xs font-medium text-black/35 hover:text-neutral-900 transition-colors"
      >
        Sign out
      </button>
    </AuthShell>
  )
}

/** Landing screen for the link inside the verification email (?verify_token=...). Works whether or not this browser has a session. */
export function VerifyEmailConfirmPage({ token, onDone }: { token: string; onDone: () => void }) {
  const { confirmVerification } = useAuth()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void confirmVerification(token)
      .then(() => {
        if (!cancelled) setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setError(err instanceof Error ? err.message : 'This verification link is invalid or has expired.')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <AuthShell>
      {status === 'checking' && (
        <div className="py-2">
          <p className="text-sm text-black/45">Confirming your email…</p>
        </div>
      )}
      {status === 'success' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 size={26} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Email verified</h1>
            <p className="text-sm text-black/45 mt-1.5">Your account is ready to go.</p>
          </div>
          <button
            type="button"
            onClick={onDone}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-colors"
          >
            Continue
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <XCircle size={26} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Verification failed</h1>
            <p className="text-sm text-black/45 mt-1.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={onDone}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-colors"
          >
            Back to sign in
          </button>
        </>
      )}
    </AuthShell>
  )
}
