'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from '@phosphor-icons/react'
import InvoiceTemplateMock from '@/components/invoice/InvoiceTemplateMock'
import { AccountReadyCelebration, SetupLoadingScreen } from '@/components/setup'
import EmptyState from '@/components/ui/EmptyState'
import OnboardingShell from './OnboardingShell'
import { getAllPackages } from '@/lib/api'
import { fmt } from '@/lib/calculations'
import { normalizeAccentColor } from '@/lib/brand-color'
import { springSoft } from '@/lib/motion'
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
  demo?: boolean
  demoPackages?: Package[]
}

export default function OnboardingYourInvoiceStep({
  step,
  settings,
  onSaved,
  demo = false,
  demoPackages,
}: OnboardingYourInvoiceStepProps) {
  const [phase, setPhase] = useState<'celebration' | 'picker'>('celebration')
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const template = (settings.invoice_template ?? DEFAULT_TEMPLATE) as InvoiceTemplateId
  const accent = normalizeAccentColor(settings.accent_color ?? DEFAULT_ACCENT)
  const businessName = settings.business_name.trim() || 'Your business'
  const selectedPkg = packages.find((p) => p.id === selectedPkgId)

  useEffect(() => {
    if (demo) {
      const active = (demoPackages ?? []).filter((p) => p.active)
      setPackages(active)
      if (active[0]) setSelectedPkgId(active[0].id)
      setLoading(false)
      return
    }
    void getAllPackages()
      .then((pkgs) => {
        const active = pkgs.filter((p) => p.active)
        setPackages(active)
        if (active[0]) setSelectedPkgId(active[0].id)
      })
      .catch(() => {
        setLoadError('Could not load services. Check your connection and try again.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [demo, demoPackages])

  const handleContinue = async () => {
    if (!selectedPkgId) return

    setSaving(true)
    setError('')
    try {
      if (demo) {
        const next = nextStepSlug(step)
        if (!next) throw new Error('Invalid step')
        onSaved(settings, next)
        return
      }

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
    return <SetupLoadingScreen variant="inline" />
  }

  if (phase === 'celebration') {
    return (
      <AccountReadyCelebration
        businessName={businessName}
        logoUrl={settings.logo_url}
        template={template}
        accent={accent}
        amount={selectedPkg?.base_price ?? packages[0]?.base_price ?? 185}
        onContinue={() => setPhase('picker')}
      />
    )
  }

  return (
    <OnboardingShell
      step={step}
      settings={settings}
      title="Your invoice"
      footnote="Edit services anytime in Settings → Packages. Customize design in Settings → Invoicing."
      continueDisabled={!selectedPkgId}
      saving={saving}
      demo={demo}
      onBack={() => {
        const prev = prevStepSlug(step)
        if (prev) onSaved(settings, prev)
      }}
      onContinue={() => void handleContinue()}
    >
      <div className="onboarding-invoice-step">
        <p className="onboarding-preview-banner" role="status">
          Preview only — nothing is sent.
        </p>

        {loadError ? (
          <p className="onboarding-error" role="alert">
            {loadError}
          </p>
        ) : null}

        <p className="ob-section-label">Your menu</p>
        {packages.length ? (
          <div className="ob-pick-list">
            {packages.map((pkg) => {
              const selected = selectedPkgId === pkg.id
              return (
                <motion.button
                  key={pkg.id}
                  type="button"
                  layout
                  className={`ob-pick-card${selected ? ' ob-pick-card--on' : ''}`}
                  animate={{ borderColor: selected ? '#22c55e' : 'rgba(60, 60, 67, 0.12)' }}
                  transition={springSoft}
                  onClick={() => setSelectedPkgId(pkg.id)}
                >
                  <div className="ob-pick-card__main">
                    <strong>{pkg.name}</strong>
                    {pkg.description ? <span className="ob-pick-card__sub">{pkg.description}</span> : null}
                  </div>
                  <div className="ob-pick-card__right">
                    <span className="ob-pick-card__price">{fmt(pkg.base_price)}</span>
                    <AnimatePresence>
                      {selected ? (
                        <motion.span
                          layoutId="package-check"
                          className="ob-pick-card__check"
                          transition={springSoft}
                          aria-hidden="true"
                        >
                          <Check size={12} weight="bold" />
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </motion.button>
              )
            })}
          </div>
        ) : (
          <EmptyState
            illustration="invoices"
            title="No services yet"
            description="Default packages will appear after sync."
          />
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

      {error ? (
        <p className="onboarding-error" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </OnboardingShell>
  )
}
