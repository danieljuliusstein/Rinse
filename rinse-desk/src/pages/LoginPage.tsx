import { useState, type FormEvent } from 'react'
import { colors } from '@/theme/colors'
import { useAuth } from '@/providers/AuthProvider'
import { RinseLockup } from '@/components/brand/RinseLogo'
import { BRAND } from '@/lib/brand-assets'

export default function LoginPage({ onBack }: { onBack?: () => void }) {
  const { signIn, backendHealthy } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: `linear-gradient(160deg, ${colors.sidebarFrom} 0%, ${colors.sidebarTo} 55%, #0a1a10 100%)` }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8 space-y-5"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back to home
          </button>
        )}

        <div className="space-y-3">
          <RinseLockup height={32} />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{BRAND.product}</h1>
            <p className="text-xs text-gray-500">Same org as the mobile operator app</p>
          </div>
        </div>

        {backendHealthy === false && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            PocketBase health check failed. You can still try signing in.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-gray-600">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500"
            placeholder="you@shop.com"
            autoComplete="username"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-gray-600">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
          style={{ background: colors.green }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
