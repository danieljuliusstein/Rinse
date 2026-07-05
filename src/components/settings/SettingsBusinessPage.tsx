'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Controller } from 'react-hook-form'
import { FloatingField } from '@/components/forms'
import { ScreenLoading } from '@/components/ui'
import { useRinseForm } from '@/hooks/useRinseForm'
import { hasCustomBusinessLogo } from '@/lib/business-logo'
import { validateLogoFile } from '@/lib/logo-upload'
import { isValidHexColor, normalizeAccentColor } from '@/lib/brand-color'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { saveSettingsAsync } from '@/lib/settings'
import { settingsBusinessSchema, type SettingsBusinessFormValues } from '@/lib/validation'
import { useActionToast } from '@/providers/ActionToastProvider'
import { useConfirm } from '@/providers/ConfirmProvider'
import { loadOrganizationSlug } from '@/lib/tenant'
import WebsiteBookingGuide from './WebsiteBookingGuide'
import LogoSection, { logoMetaFromFile, logoMetaFromUrl, type LogoMeta } from './LogoSection'
import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'

export default function SettingsBusinessPage() {
  const { settings, ready, update, reload, registerSaveGuard } = useSettingsDraft()
  const confirm = useConfirm()
  const { showMessage } = useActionToast()
  const formRef = useRef<HTMLDivElement>(null)
  const [orgSlug, setOrgSlug] = useState('')
  const [removingLogo, setRemovingLogo] = useState(false)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoMeta, setLogoMeta] = useState<LogoMeta | null>(null)

  const { control, watch, reset, trigger } = useRinseForm<SettingsBusinessFormValues>({
    schema: settingsBusinessSchema,
    defaultValues: {
      business_name: '',
      business_phone: '',
      business_email: '',
      business_address: '',
    },
  })

  const businessName = watch('business_name')
  const businessPhone = watch('business_phone')
  const businessEmail = watch('business_email')
  const businessAddress = watch('business_address')

  useEffect(() => {
    if (!settings) return
    reset({
      business_name: settings.business_name,
      business_phone: settings.business_phone,
      business_email: settings.business_email,
      business_address: settings.business_address,
    })
  }, [
    settings?.business_name,
    settings?.business_phone,
    settings?.business_email,
    settings?.business_address,
    reset,
    settings,
  ])

  useEffect(() => {
    registerSaveGuard(async () => {
      const valid = await trigger()
      if (!valid) {
        showMessage('Please fix the highlighted fields.')
        return false
      }
      return true
    })
    return () => registerSaveGuard(null)
  }, [registerSaveGuard, trigger, showMessage])

  useEffect(() => {
    void loadOrganizationSlug().then((slug) => setOrgSlug(slug ?? ''))
  }, [])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [businessName, businessPhone, businessEmail, businessAddress])

  const bookingUrl =
    typeof window !== 'undefined' && orgSlug ? `${window.location.origin}/book/${orgSlug}` : ''
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    return () => {
      if (logoPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoPreviewUrl])

  const displayLogoSrc: string | null =
    logoPreviewUrl ??
    (settings && hasCustomBusinessLogo(settings.logo_url) ? settings.logo_url ?? null : null)

  useEffect(() => {
    if (!displayLogoSrc) {
      setLogoMeta(null)
      return
    }
    if (logoPreviewUrl) return
    let cancelled = false
    void logoMetaFromUrl(displayLogoSrc).then((meta) => {
      if (!cancelled) setLogoMeta(meta)
    })
    return () => {
      cancelled = true
    }
  }, [displayLogoSrc, logoPreviewUrl])

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !settings) return

    setLogoError(null)

    const validationError = validateLogoFile(file)
    if (validationError) {
      setLogoError(validationError)
      return
    }

    if (logoPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl)
    const preview = URL.createObjectURL(file)
    setLogoPreviewUrl(preview)
    setLogoUploading(true)
    void logoMetaFromFile(file).then(setLogoMeta)

    try {
      const saved = await saveSettingsAsync(settings, file)
      if (!hasCustomBusinessLogo(saved.logo_url)) {
        throw new Error('Logo was not saved')
      }
      URL.revokeObjectURL(preview)
      setLogoPreviewUrl(null)
      await reload()
    } catch {
      setLogoError('Could not save logo. Check your connection and try again.')
      setLogoMeta(null)
    } finally {
      setLogoUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!hasCustomBusinessLogo(settings?.logo_url)) return
    const ok = await confirm({
      title: 'Remove logo?',
      message: 'Remove your custom logo? The default mark will be used until you upload a new one.',
      confirmLabel: 'Remove logo',
      cancelLabel: 'Keep logo',
      destructive: true,
    })
    if (!ok) return
    setRemovingLogo(true)
    try {
      await saveSettingsAsync({ ...settings!, logo_url: '/logo.png' }, null, { clearLogo: true })
      setLogoMeta(null)
      await reload()
    } finally {
      setRemovingLogo(false)
    }
  }

  if (!ready || !settings) {
    return <ScreenLoading body variant="settings" />
  }

  return (
    <SettingsDetailShell title="Your business">
      <div className="settings-panel">
        <div className="settings-field">
          <h2 className="settings-section-head" id="settings-logo-label">
            Logo
          </h2>
          <LogoSection
            logoSrc={displayLogoSrc}
            businessName={settings.business_name}
            logoMeta={logoMeta}
            uploading={logoUploading}
            removing={removingLogo}
            error={logoError}
            inputId="settings-logo"
            onFileChange={(e) => void handleLogoChange(e)}
            onRemoveLogo={() => void handleRemoveLogo()}
          />
        </div>

        <div className="settings-field settings-accent-field">
          <h2 className="settings-section-head">Brand accent</h2>
          <p className="settings-panel__lead settings-panel__lead--tight">
            Used on your booking page and client portal.
          </p>
          <div className="settings-accent-row">
            <input
              type="color"
              className="settings-accent-swatch-input"
              value={normalizeAccentColor(settings.accent_color)}
              onChange={(e) => update('accent_color', e.target.value)}
              aria-label="Accent color"
            />
            <input
              type="text"
              className="f-input settings-accent-hex"
              value={settings.accent_color ?? ''}
              placeholder="#22c55e"
              onChange={(e) => {
                const next = e.target.value
                if (!next.trim() || isValidHexColor(next)) update('accent_color', next.trim() || null)
              }}
            />
          </div>
          <div className="settings-accent-preview client-light-root" style={{ '--cl-accent': normalizeAccentColor(settings.accent_color) } as CSSProperties}>
            <div className="cl-card settings-accent-preview__card">
              <p className="cl-label">Preview</p>
              <button type="button" className="cl-btn-primary">
                Book now
              </button>
            </div>
          </div>
        </div>

        <div ref={formRef} className="page-form-card page-form" style={{ marginTop: 0 }}>
          <Controller
            control={control}
            name="business_name"
            render={({ field, fieldState }) => (
              <FloatingField
                id="settings-business_name"
                label="Business name"
                filled={field.value.trim().length > 0}
                error={fieldState.error?.message}
              >
                <input
                  id="settings-business_name"
                  className={`f-input${field.value.trim() ? ' hv' : ''}`}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    update('business_name', e.target.value)
                  }}
                  onBlur={field.onBlur}
                  placeholder=" "
                  autoComplete="organization"
                />
              </FloatingField>
            )}
          />

          <div className="settings-divider" />

          <Controller
            control={control}
            name="business_phone"
            render={({ field, fieldState }) => (
              <FloatingField
                id="settings-business_phone"
                label="Phone"
                filled={(field.value ?? '').trim().length > 0}
                optional
                error={fieldState.error?.message}
              >
                <input
                  id="settings-business_phone"
                  className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
                  type="tel"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    update('business_phone', e.target.value)
                  }}
                  onBlur={field.onBlur}
                  placeholder=" "
                />
              </FloatingField>
            )}
          />

          <Controller
            control={control}
            name="business_email"
            render={({ field, fieldState }) => (
              <FloatingField
                id="settings-business_email"
                label="Email"
                filled={(field.value ?? '').trim().length > 0}
                optional
                error={fieldState.error?.message}
              >
                <input
                  id="settings-business_email"
                  className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
                  type="email"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    update('business_email', e.target.value)
                  }}
                  onBlur={field.onBlur}
                  placeholder=" "
                />
              </FloatingField>
            )}
          />

          <Controller
            control={control}
            name="business_address"
            render={({ field, fieldState }) => (
              <FloatingField
                id="settings-business_address"
                label="Address"
                filled={(field.value ?? '').trim().length > 0}
                optional
                error={fieldState.error?.message}
              >
                <input
                  id="settings-business_address"
                  className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    update('business_address', e.target.value)
                  }}
                  onBlur={field.onBlur}
                  placeholder=" "
                />
              </FloatingField>
            )}
          />
        </div>

        <div className="settings-divider" />

        <h2 className="settings-section-head">Get booked online</h2>
        <p className="settings-section-desc">
          Works with what you already have — no need to rebuild your site.
        </p>

        <section className="card settings-booking-card">
          {orgSlug && appOrigin && bookingUrl ? (
            <WebsiteBookingGuide
              appOrigin={appOrigin}
              slug={orgSlug}
              bookingUrl={bookingUrl}
              brandName={settings.business_name}
            />
          ) : (
            <p className="settings-status-line">Your booking options will appear after you sign in.</p>
          )}
        </section>
      </div>
    </SettingsDetailShell>
  )
}
