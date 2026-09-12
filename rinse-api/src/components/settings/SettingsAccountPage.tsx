'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { FloatingField, SheetSubmitButton } from '@/components/forms'
import { Button, ListRow, SectionGroup } from '@/components/ui'
import { useRinseForm } from '@/hooks/useRinseForm'
import {
  changePassword,
  getCurrentUserEmail,
  requestPasswordReset,
} from '@/lib/pb-auth'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { settingsAccountSchema, type SettingsAccountFormValues } from '@/lib/validation'
import { useAuth } from '@/providers/AuthProvider'
import SettingsDetailShell from './SettingsDetailShell'

export default function SettingsAccountPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
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
  }, [isLoggedIn])

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

  if (!isLoggedIn) {
    return (
      <SettingsDetailShell title="Account" showSave={false}>
        <div className="settings-panel">
          <p className="settings-panel__lead">Sign in to view your login email and manage your password.</p>
          <Button type="button" onClick={() => router.push('/auth')}>
            Sign in
          </Button>
        </div>
      </SettingsDetailShell>
    )
  }

  return (
    <SettingsDetailShell title="Account" showSave={false}>
      <div ref={formRef} className="settings-account">
        <section className="settings-panel">
          <h2 className="settings-account__heading">Sign-in</h2>
          <p className="settings-panel__lead">Your Rinse login uses email and password.</p>
          <FloatingField id="account-email" label="Email" filled={Boolean(email)} showCheck={false}>
            <input
              id="account-email"
              type="email"
              className={`f-input hv`}
              placeholder=" "
              value={email ?? ''}
              readOnly
              aria-readonly="true"
            />
          </FloatingField>
          <div className="settings-account__password-mask" aria-hidden="true">
            <span className="settings-account__password-label">Password</span>
            <span className="settings-account__password-dots">••••••••</span>
          </div>
        </section>

        <section className="settings-panel">
          <h2 className="settings-account__heading">Change password</h2>
          <p className="settings-panel__lead">Enter your current password, then choose a new one.</p>
          <Controller
            control={control}
            name="current_password"
            render={({ field, fieldState }) => (
              <FloatingField
                id="account-old-password"
                label="Current password"
                filled={(field.value ?? '').length > 0}
                showCheck={false}
                error={fieldState.error?.message}
              >
                <input
                  id="account-old-password"
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
                id="account-new-password"
                label="New password"
                filled={(field.value ?? '').length > 0}
                showCheck={false}
                error={fieldState.error?.message}
              >
                <input
                  id="account-new-password"
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
                id="account-confirm-password"
                label="Confirm new password"
                filled={(field.value ?? '').length > 0}
                showCheck={false}
                error={fieldState.error?.message}
              >
                <input
                  id="account-confirm-password"
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
          {passwordError ? <p className="settings-msg settings-msg--error">{passwordError}</p> : null}
          {passwordMsg ? <p className="settings-msg">{passwordMsg}</p> : null}
          <SheetSubmitButton
            label="Update password"
            ready={Boolean(currentPassword && newPassword && confirmPassword) && !passwordBusy}
            disabled={passwordBusy}
            done={passwordMsg === 'Password updated'}
            onClick={() => void handleChangePassword()}
          />
        </section>

        <section className="settings-panel">
          <h2 className="settings-account__heading">Forgot password?</h2>
          <p className="settings-panel__lead">
            We&apos;ll email a reset link to <strong>{email ?? 'your address'}</strong>. Use it if you can&apos;t
            remember your current password.
          </p>
          <Button type="button" variant="ghost" loading={resetBusy} onClick={() => void handleSendResetEmail()}>
            Send reset email
          </Button>
          {resetMsg ? (
            <p className={`settings-msg${resetMsg.startsWith('Reset link sent') ? '' : ' settings-msg--error'}`}>
              {resetMsg}
            </p>
          ) : null}
        </section>

        <SectionGroup title="Data">
          <ListRow
            title="Access and data"
            subtitle="Backups, export, and delete account"
            onClick={() => router.push('/settings/access')}
          />
        </SectionGroup>
      </div>
    </SettingsDetailShell>
  )
}
