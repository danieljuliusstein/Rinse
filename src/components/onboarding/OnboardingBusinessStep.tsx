'use client'

import { useState } from 'react'
import { SetupRowField } from '@/components/forms'
import OnboardingShell from './OnboardingShell'
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
}

export default function OnboardingBusinessStep({ step, settings, onSaved }: OnboardingBusinessStepProps) {
  const [businessName, setBusinessName] = useState(settings.business_name ?? '')
  const [phone, setPhone] = useState(settings.business_phone ?? '')
  const [email, setEmail] = useState(settings.business_email ?? '')
  const [address, setAddress] = useState(settings.business_address ?? '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    settings.logo_url && settings.logo_url !== '/logo.png' ? settings.logo_url : null,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canContinue = businessName.trim().length > 0 && phone.trim().length > 0

  const handleContinue = async () => {
    if (!canContinue) return

    setSaving(true)
    setError('')
    try {
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
    <OnboardingShell
      step={step}
      settings={settings}
      title="Your business"
      intro="Quick setup — then you'll see your first invoice."
      footnote="Shown on invoices and your booking page."
      continueDisabled={!canContinue}
      saving={saving}
      showBack={Boolean(prevStepSlug(step))}
      onBack={() => {
        const prev = prevStepSlug(step)
        if (prev) onSaved(settings, prev)
      }}
      onContinue={() => void handleContinue()}
    >
      <p className="ob-section-label">Business details</p>
      <div className="ob-field-group">
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

      <p className="ob-section-label">Logo</p>
      <div
        className={[
          'onboarding-logo-picker',
          logoPreview ? 'onboarding-logo-picker--complete' : '',
          saving && logoFile ? 'onboarding-logo-picker--uploading' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {logoPreview ? <img src={logoPreview} alt="" /> : null}
        <label htmlFor="ob-logo" className="onboarding-logo-btn">
          {logoPreview ? 'Change logo' : 'Add logo (optional)'}
        </label>
        <input
          id="ob-logo"
          type="file"
          accept="image/*"
          disabled={saving}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            setLogoFile(file)
            if (file) setLogoPreview(URL.createObjectURL(file))
          }}
        />
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

      {error ? <p className="onboarding-error">{error}</p> : null}
    </OnboardingShell>
  )
}
