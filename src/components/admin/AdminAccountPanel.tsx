'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { FloatingField, SheetSubmitButton } from '@/components/forms'
import { Button } from '@/components/ui'
import { useRinseForm } from '@/hooks/useRinseForm'
import { changePassword, getCurrentUserEmail, requestPasswordReset } from '@/lib/pb-auth'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { useAuth } from '@/providers/AuthProvider'
import { settingsAccountSchema, type SettingsAccountFormValues } from '@/lib/validation'

export default function AdminAccountPanel() {
  const { logout } = useAuth()
  const formRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [resetBusy, setResetBusy] = useState(false)
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  const { control, watch, reset, submitWithToast } = useRinseForm<SettingsAccountFormValues>({
    schema: settingsAccountSchema,
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const currentPassword = watch('current_password')
  const newPassword = watch('new_password')
  const confirmPassword = watch('confirm_password')

  useEffect(() => {
    setEmail(getCurrentUserEmail())
  }, [])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [currentPassword, newPassword, confirmPassword, email])

  const handleChangePassword = submitWithToast(async (values) => {
    setPasswordError(null)
    setPasswordMsg(null)
    if (!values.new_password?.trim()) return
    setPasswordBusy(true)
    const result = await changePassword({
      oldPassword: values.current_password ?? '',
      password: values.new_password,
      passwordConfirm: values.confirm_password ?? '',
    })
    setPasswordBusy(false)
    if (!result.ok) {
      setPasswordError(result.error)
      return
    }
    reset({
      current_password: '',
      new_password: '',
      confirm_password: '',
    })
    setPasswordMsg('Password updated')
  })

  const handleSendResetEmail = async () => {
    if (!email) return
    setResetMsg(null)
    setResetBusy(true)
    const result = await requestPasswordReset(email)
    setResetBusy(false)
    if (!result.ok) {
      setResetMsg(result.error)
      return
    }
    setResetMsg(`Reset link sent to ${email}`)
  }

  return (
    <div ref={formRef}>
      <div className="admin-page-header">
        <div className="admin-page-title">Account</div>
        <div className="admin-page-desc">HQ console sign-in and password.</div>
      </div>

      <div className="admin-card" style={{ padding: 18, marginBottom: 12 }}>
        <div className="drawer-section-label">Sign-in email</div>
        <p className="mono" style={{ margin: '8px 0 0', fontSize: 14 }}>
          {email ?? '—'}
        </p>
      </div>

      <div className="admin-card" style={{ padding: 18, marginBottom: 12 }}>
        <div className="drawer-section-label">Change password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <Controller
            control={control}
            name="current_password"
            render={({ field, fieldState }) => (
              <FloatingField
                id="admin-account-old-password"
                label="Current password"
                filled={(field.value ?? '').length > 0}
                showCheck={false}
                error={fieldState.error?.message}
              >
                <input
                  id="admin-account-old-password"
                  type="password"
                  className={`f-input${field.value ? ' hv' : ''}`}
                  placeholder=" "
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  autoComplete="current-password"
                />
              </FloatingField>
            )}
          />
          <Controller
            control={control}
            name="new_password"
            render={({ field, fieldState }) => (
              <FloatingField
                id="admin-account-new-password"
                label="New password"
                filled={(field.value ?? '').length > 0}
                showCheck={false}
                error={fieldState.error?.message}
              >
                <input
                  id="admin-account-new-password"
                  type="password"
                  className={`f-input${field.value ? ' hv' : ''}`}
                  placeholder=" "
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  autoComplete="new-password"
                />
              </FloatingField>
            )}
          />
          <Controller
            control={control}
            name="confirm_password"
            render={({ field, fieldState }) => (
              <FloatingField
                id="admin-account-confirm-password"
                label="Confirm new password"
                filled={(field.value ?? '').length > 0}
                showCheck={false}
                error={fieldState.error?.message}
              >
                <input
                  id="admin-account-confirm-password"
                  type="password"
                  className={`f-input${field.value ? ' hv' : ''}`}
                  placeholder=" "
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  autoComplete="new-password"
                />
              </FloatingField>
            )}
          />
        </div>
        {passwordError ? (
          <p className="settings-msg settings-msg--error" role="alert">
            {passwordError}
          </p>
        ) : null}
        {passwordMsg ? <p className="settings-msg">{passwordMsg}</p> : null}
        <div style={{ marginTop: 12 }}>
          <SheetSubmitButton
            label="Update password"
            ready={Boolean(currentPassword && newPassword && confirmPassword) && !passwordBusy}
            disabled={passwordBusy}
            done={passwordMsg === 'Password updated'}
            onClick={() => void handleChangePassword()}
          />
        </div>
      </div>

      <div className="admin-card" style={{ padding: 18, marginBottom: 12 }}>
        <div className="drawer-section-label">Forgot password?</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 12px' }}>
          Email a reset link to <strong>{email ?? 'your address'}</strong>.
        </p>
        <Button type="button" variant="ghost" loading={resetBusy} onClick={() => void handleSendResetEmail()}>
          Send reset email
        </Button>
        {resetMsg ? (
          <p className={`settings-msg${resetMsg.startsWith('Reset link sent') ? '' : ' settings-msg--error'}`}>
            {resetMsg}
          </p>
        ) : null}
      </div>

      <div className="admin-card" style={{ padding: 18 }}>
        <div className="drawer-section-label">Session</div>
        <button type="button" className="btn danger small" style={{ marginTop: 10 }} onClick={() => logout({ lane: 'admin' })}>
          Sign out
        </button>
      </div>
    </div>
  )
}
