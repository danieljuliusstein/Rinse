'use client'

import { useEffect, useRef, useState } from 'react'
import AppLogo from '@/components/AppLogo'
import { FloatingField } from '@/components/forms'
import { Button } from '@/components/ui'
import { confirmPasswordReset } from '@/lib/pb-auth'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'

interface PasswordResetConfirmProps {
  token: string
  onAuthenticated: () => void
}

export default function PasswordResetConfirm({ token, onAuthenticated }: PasswordResetConfirmProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [password, confirm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const result = await confirmPasswordReset({
        token,
        password,
        passwordConfirm: confirm,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      onAuthenticated()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen__logo">
        <AppLogo size={56} priority />
      </div>
      <h1 className="auth-screen__title">Set new password</h1>
      <p className="auth-screen__subtitle">Choose a new password for your account.</p>

      <form ref={formRef} className="auth-form page-form" onSubmit={handleSubmit}>
        <FloatingField id="reset-password" label="New password" filled={password.length > 0}>
          <input
            id="reset-password"
            type="password"
            className={`f-input${password ? ' hv' : ''}`}
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FloatingField>
        <FloatingField id="reset-confirm" label="Confirm password" filled={confirm.length > 0}>
          <input
            id="reset-confirm"
            type="password"
            className={`f-input${confirm ? ' hv' : ''}`}
            placeholder=" "
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FloatingField>

        {error ? <p className="auth-error">{error}</p> : null}

        <Button type="submit" loading={loading}>
          Save password
        </Button>
      </form>
    </div>
  )
}
