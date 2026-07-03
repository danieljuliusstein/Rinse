'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { FloatingField } from '@/components/forms'
import { hasCustomBusinessLogo } from '@/lib/business-logo'
import { validateLogoFile } from '@/lib/logo-upload'
import { isValidHexColor, normalizeAccentColor } from '@/lib/brand-color'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { saveSettingsAsync } from '@/lib/settings'
import { useConfirm } from '@/providers/ConfirmProvider'
import { loadOrganizationSlug } from '@/lib/tenant'
import WebsiteBookingGuide from './WebsiteBookingGuide'
import LogoSection, { logoMetaFromFile, logoMetaFromUrl, type LogoMeta } from './LogoSection'
import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'

export default function SettingsBusinessPage() {
  const { settings, ready, update, reload } = useSettingsDraft()
  const confirm = useConfirm()
  const formRef = useRef<HTMLDivElement>(null)
  const [orgSlug, setOrgSlug] = useState('')
  const [removingLogo, setRemovingLogo] = useState(false)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoMeta, setLogoMeta] = useState<LogoMeta | null>(null)

  useEffect(() => {
    void loadOrganizationSlug().then((slug) => setOrgSlug(slug ?? ''))
  }, [])

  useEffect(() => {
    if (!settings) return
    syncPrefilledFloatingLabels(formRef.current)
  }, [settings?.business_name, settings?.business_phone, settings?.business_email, settings?.business_address])

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
    return (
      <div className="screen page-content settings-screen settings-screen--loading">
        Loading…
      </div>
    )
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
          <FloatingField id="settings-business_name" label="Business name" filled={settings.business_name.trim().length > 0}>
            <input
              id="settings-business_name"
              className={`f-input${settings.business_name.trim() ? ' hv' : ''}`}
              value={settings.business_name}
              onChange={(e) => update('business_name', e.target.value)}
              placeholder=" "
              autoComplete="organization"
            />
          </FloatingField>

          <div className="settings-divider" />

          <FloatingField id="settings-business_phone" label="Phone" filled={settings.business_phone.trim().length > 0} optional>
            <input
              id="settings-business_phone"
              className={`f-input${settings.business_phone.trim() ? ' hv' : ''}`}
              type="tel"
              value={settings.business_phone}
              onChange={(e) => update('business_phone', e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingField id="settings-business_email" label="Email" filled={settings.business_email.trim().length > 0} optional>
            <input
              id="settings-business_email"
              className={`f-input${settings.business_email.trim() ? ' hv' : ''}`}
              type="email"
              value={settings.business_email}
              onChange={(e) => update('business_email', e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingField id="settings-business_address" label="Address" filled={settings.business_address.trim().length > 0} optional>
            <input
              id="settings-business_address"
              className={`f-input${settings.business_address.trim() ? ' hv' : ''}`}
              value={settings.business_address}
              onChange={(e) => update('business_address', e.target.value)}
              placeholder=" "
            />
          </FloatingField>
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
