'use client'

import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Image as ImageIcon } from '@phosphor-icons/react'
import { SetupRowField } from '@/components/forms'
import { LogoPickerSheet, SetupHeroBand } from '@/components/setup'
import { SETUP_HERO_BUSINESS } from '@/lib/setup-hero-assets'
import OnboardingShell from './OnboardingShell'
import { springPop } from '@/lib/motion'
import { trackOnboardingStepCompleted } from '@/lib/onboarding-analytics'
import {
  nextStepSlug,
  prevStepSlug,
  saveOnboardingStep,
  stepNumberFromSlug,
  type OnboardingStepSlug,
} from '@/lib/onboarding'
import type { AppSettings } from '@/lib/settings'

interface OnboardingBusinessStepProps {
  step: OnboardingStepSlug
  settings: AppSettings
  onSaved: (settings: AppSettings, next: OnboardingStepSlug) => void
  demo?: boolean
}

export default function OnboardingBusinessStep({ step, settings, onSaved, demo = false }: OnboardingBusinessStepProps) {
  const [businessName, setBusinessName] = useState(settings.business_name ?? '')
  const [phone, setPhone] = useState(settings.business_phone ?? '')
  const [email, setEmail] = useState(settings.business_email ?? '')
  const [address, setAddress] = useState(settings.business_address ?? '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    settings.logo_url && settings.logo_url !== '/logo.png' ? settings.logo_url : null,
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const canContinue = businessName.trim().length > 0 && phone.trim().length > 0
  const displayName = businessName.trim() || 'Your business'
  const logoComplete = Boolean(logoPreview)
  const businessHero = SETUP_HERO_BUSINESS ? <SetupHeroBand src={SETUP_HERO_BUSINESS} /> : undefined

  const applyLogoFile = (file: File | null) => {
    setLogoFile(file)
    if (file) setLogoPreview(URL.createObjectURL(file))
  }

  const handleContinue = async () => {
    if (!canContinue) return

    setSaving(true)
    setError('')
    try {
      if (demo) {
        const next = nextStepSlug(step)
        if (!next) throw new Error('Invalid step')
        onSaved(
          {
            ...settings,
            business_name: businessName.trim(),
            business_phone: phone.trim(),
            business_email: email.trim(),
            business_address: address.trim(),
            logo_url: logoPreview ?? settings.logo_url,
          },
          next,
        )
        return
      }

      const { saveSettingsAsync } = await import('@/lib/settings')
      const saved = await saveSettingsAsync(
        {
          ...settings,
          business_name: businessName.trim(),
          business_phone: phone.trim(),
          business_email: email.trim(),
          business_address: address.trim(),
        },
        logoFile,
      )
      const next = nextStepSlug(step)
      if (!next) throw new Error('Invalid step')
      const withStep = await saveOnboardingStep(stepNumberFromSlug(next), saved)
      trackOnboardingStepCompleted(step)
      onSaved(withStep, next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <OnboardingShell
        step={step}
        settings={settings}
        title="Your business"
        intro="Quick setup — then you'll see your first invoice."
        footnote="Shown on invoices and your booking page."
        continueDisabled={!canContinue}
        continueHint={!canContinue ? 'Add business name and phone to continue' : undefined}
        saving={saving}
        showBack={Boolean(prevStepSlug(step))}
        hero={businessHero}
        progressVariant={businessHero ? 'hero' : 'default'}
        demo={demo}
        onBack={() => {
          const prev = prevStepSlug(step)
          if (prev) onSaved(settings, prev)
        }}
        onContinue={() => void handleContinue()}
      >
        <p className="ob-section-label">Logo</p>
        <div className="setup-logo-block">
          <div className={`setup-identity-card${logoPreview ? '' : ' setup-identity-card--empty'}`}>
            {logoPreview ? (
              <img src={logoPreview} alt="" className="setup-identity-card__logo" />
            ) : (
              <span className="setup-identity-card__placeholder" aria-hidden="true">
                <ImageIcon size={28} weight="duotone" />
              </span>
            )}
            <div className="setup-identity-card__text">
              <strong>{displayName}</strong>
              <span>Mobile detailing</span>
            </div>
          </div>

          {logoComplete ? (
            <>
              <motion.div
                className="setup-complete-pill"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springPop}
              >
                Complete
              </motion.div>
              <button type="button" className="setup-logo-change" onClick={() => setSheetOpen(true)} disabled={saving}>
                Change logo
              </button>
            </>
          ) : (
            <button type="button" className="setup-choose-image" onClick={() => setSheetOpen(true)} disabled={saving}>
              Choose image
            </button>
          )}

          {saving && logoFile ? (
            <div
              className="onboarding-logo-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={100}
              aria-label="Uploading logo"
            >
              <div className="onboarding-logo-progress__fill" />
            </div>
          ) : null}
        </div>

        <p className="ob-section-label">Business details</p>
        <div className="ob-field-group setup-form-group">
          <SetupRowField
            id="ob-name"
            label="Business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            autoComplete="organization"
          />
          <SetupRowField
            id="ob-phone"
            label="Business phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <SetupRowField
            id="ob-email"
            label="Business email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            optional
          />
          <SetupRowField
            id="ob-address"
            label="Business address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
            optional
          />
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="setup-logo-input"
          disabled={saving}
          onChange={(e) => applyLogoFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="setup-logo-input"
          disabled={saving}
          onChange={(e) => applyLogoFile(e.target.files?.[0] ?? null)}
        />

        {error ? (
          <p className="onboarding-error" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}
      </OnboardingShell>

      <LogoPickerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        disabled={saving}
        onTakePhoto={() => cameraRef.current?.click()}
        onChooseGallery={() => galleryRef.current?.click()}
      />
    </>
  )
}
