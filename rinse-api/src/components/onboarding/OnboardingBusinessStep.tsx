'use client'

import { useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
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
import { useRinseForm } from '@/hooks/useRinseForm'
import { formatPhoneAsYouType, formatUSPhoneDisplay, normalizeUSPhone } from '@/lib/phone-format'
import { onboardingBusinessSchema, type OnboardingBusinessFormValues } from '@/lib/validation'

interface OnboardingBusinessStepProps {
  step: OnboardingStepSlug
  settings: AppSettings
  onSaved: (settings: AppSettings, next: OnboardingStepSlug) => void
  demo?: boolean
}

export default function OnboardingBusinessStep({ step, settings, onSaved, demo = false }: OnboardingBusinessStepProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    settings.logo_url && settings.logo_url !== '/logo.png' ? settings.logo_url : null,
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const { control, watch, submitWithToast } = useRinseForm<OnboardingBusinessFormValues>({
    schema: onboardingBusinessSchema,
    defaultValues: {
      business_name: settings.business_name ?? '',
      business_phone: settings.business_phone ?? '',
      business_email: settings.business_email ?? '',
      business_address: settings.business_address ?? '',
    },
  })

  const businessName = watch('business_name')
  const phone = watch('business_phone')
  const canContinue = businessName.trim().length > 0 && phone.trim().length > 0
  const displayName = businessName.trim() || 'Your business'
  const logoComplete = Boolean(logoPreview)
  const businessHero = SETUP_HERO_BUSINESS ? <SetupHeroBand src={SETUP_HERO_BUSINESS} /> : undefined

  const applyLogoFile = (file: File | null) => {
    setLogoFile(file)
    if (file) setLogoPreview(URL.createObjectURL(file))
  }

  const handleContinue = submitWithToast(async (values) => {
    setSaving(true)
    setError('')
    try {
      const business_phone = normalizeUSPhone(values.business_phone)
      const business_email = values.business_email ?? ''
      const business_address = values.business_address ?? ''

      if (demo) {
        const next = nextStepSlug(step)
        if (!next) throw new Error('Invalid step')
        onSaved(
          {
            ...settings,
            business_name: values.business_name,
            business_phone,
            business_email,
            business_address,
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
          business_name: values.business_name,
          business_phone,
          business_email,
          business_address,
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
  })

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
          <Controller
            control={control}
            name="business_name"
            render={({ field, fieldState }) => (
              <SetupRowField
                id="ob-name"
                label="Business name"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                autoComplete="organization"
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="business_phone"
            render={({ field, fieldState }) => {
              const display =
                field.value && !fieldState.isDirty
                  ? formatUSPhoneDisplay(String(field.value))
                  : formatPhoneAsYouType(String(field.value ?? ''))

              return (
                <SetupRowField
                  id="ob-phone"
                  label="Business phone"
                  type="tel"
                  inputMode="tel"
                  value={display}
                  onChange={(e) => field.onChange(formatPhoneAsYouType(e.target.value))}
                  onBlur={field.onBlur}
                  autoComplete="tel"
                  error={fieldState.error?.message}
                />
              )
            }}
          />
          <Controller
            control={control}
            name="business_email"
            render={({ field, fieldState }) => (
              <SetupRowField
                id="ob-email"
                label="Business email"
                type="email"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                autoComplete="email"
                optional
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="business_address"
            render={({ field, fieldState }) => (
              <SetupRowField
                id="ob-address"
                label="Business address"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                autoComplete="street-address"
                optional
                error={fieldState.error?.message}
              />
            )}
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
