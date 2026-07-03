'use client'

import { useEffect, useState } from 'react'
import { Check } from '@phosphor-icons/react'
import InvoiceTemplateMock from '@/components/invoice/InvoiceTemplateMock'
import OnboardingShell from './OnboardingShell'
import { getAllPackages } from '@/lib/api'
import { fmt } from '@/lib/calculations'
import { normalizeAccentColor } from '@/lib/brand-color'
import { trackOnboardingStepCompleted } from '@/lib/onboarding-analytics'
import type { InvoiceTemplateId } from '@/lib/invoice-templates'
import {
  markFirstInvoiceCreated,
  nextStepSlug,
  prevStepSlug,
  saveOnboardingStep,
  stepNumberFromSlug,
  type OnboardingStepSlug,
} from '@/lib/onboarding'
import type { AppSettings } from '@/lib/settings'
import type { Package } from '@/lib/types'

const SAMPLE_CLIENT_NAME = 'Sample Client'
const DEFAULT_TEMPLATE: InvoiceTemplateId = 'rinse'
const DEFAULT_ACCENT = '#22c55e'

interface OnboardingYourInvoiceStepProps {
  step: OnboardingStepSlug
  settings: AppSettings
  onSaved: (settings: AppSettings, next: OnboardingStepSlug) => void
}

export default function OnboardingYourInvoiceStep({
  step,
  settings,
  onSaved,
}: OnboardingYourInvoiceStepProps) {
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const template = (settings.invoice_template ?? DEFAULT_TEMPLATE) as InvoiceTemplateId
  const accent = normalizeAccentColor(settings.accent_color ?? DEFAULT_ACCENT)
  const businessName = settings.business_name.trim() || 'Your business'
  const selectedPkg = packages.find((p) => p.id === selectedPkgId)

  useEffect(() => {
    void getAllPackages().then((pkgs) => {
      const active = pkgs.filter((p) => p.active)
      setPackages(active)
      if (active[0]) setSelectedPkgId(active[0].id)
      setLoading(false)
    })
  }, [])

  const handleContinue = async () => {
    if (!selectedPkgId) return

    setSaving(true)
    setError('')
    try {
      const { saveSettingsAsync } = await import('@/lib/settings')
      const saved = await saveSettingsAsync({
        ...settings,
        invoice_template: template,
        accent_color: accent,
      })
      await markFirstInvoiceCreated()
      const next = nextStepSlug(step)
      if (!next) throw new Error('Invalid step')
      const withStep = await saveOnboardingStep(stepNumberFromSlug(next), saved)
      trackOnboardingStepCompleted(step)
      onSaved(withStep, next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not continue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-text">Loading…</div>
      </div>
    )
  }

  return (
    <OnboardingShell
      step={step}
      settings={settings}
      title="Your invoice"
      footnote="Edit services anytime in Settings → Packages. Customize invoice design in Settings → Invoicing."
      continueDisabled={!selectedPkgId}
      saving={saving}
      onBack={() => {
        const prev = prevStepSlug(step)
        if (prev) onSaved(settings, prev)
      }}
      onContinue={() => void handleContinue()}
    >
      <div className="onboarding-invoice-step">
        <p className="onboarding-account-hero" role="status">
          <Check size={18} weight="bold" aria-hidden="true" />
          You&apos;re set — here&apos;s your first invoice
        </p>

        <div className="onboarding-first-invoice-phases" aria-hidden="true">
          <span className="onboarding-first-invoice-phases__item onboarding-first-invoice-phases__item--on">
            Menu
          </span>
          <span className="onboarding-first-invoice-phases__item onboarding-first-invoice-phases__item--on">
            Preview
          </span>
          <span className="onboarding-first-invoice-phases__item">Share</span>
        </div>

        <p className="onboarding-preview-banner" role="status">
          Preview only — nothing is sent.
        </p>

        <p className="ob-section-label">Your menu</p>
        {packages.length ? (
          <div className="ob-pick-list">
            {packages.map((pkg) => {
              const selected = selectedPkgId === pkg.id
              return (
                <button
                  key={pkg.id}
                  type="button"
                  className={`ob-pick-card${selected ? ' ob-pick-card--on' : ''}`}
                  onClick={() => setSelectedPkgId(pkg.id)}
                >
                  <div className="ob-pick-card__main">
                    <strong>{pkg.name}</strong>
                    {pkg.description ? <span className="ob-pick-card__sub">{pkg.description}</span> : null}
                  </div>
                  <div className="ob-pick-card__right">
                    <span className="ob-pick-card__price">{fmt(pkg.base_price)}</span>
                    <span className="ob-pick-card__check" aria-hidden="true">
                      <Check size={12} weight="bold" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="onboarding-invoice-step__empty">Default services will appear after sync.</p>
        )}

        <p className="ob-section-label">Preview</p>
        <div className="onboarding-invoice-preview onboarding-invoice-preview--hero">
          <InvoiceTemplateMock
            template={template}
            accent={accent}
            businessName={businessName}
            logoUrl={settings.logo_url}
            scale="full"
            clientName={SAMPLE_CLIENT_NAME}
            serviceName={selectedPkg?.name ?? 'Detailing service'}
            serviceNote="Sedan · mobile"
            amount={selectedPkg?.base_price ?? 0}
          />
        </div>
      </div>

      {error ? <p className="onboarding-error">{error}</p> : null}
    </OnboardingShell>
  )
}
