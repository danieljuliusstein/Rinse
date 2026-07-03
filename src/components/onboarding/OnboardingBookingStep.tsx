'use client'

import { useEffect, useState } from 'react'
import { Copy, ShareNetwork } from '@phosphor-icons/react'
import WebsiteBookingGuide from '@/components/settings/WebsiteBookingGuide'
import OnboardingShell from './OnboardingShell'
import { getCurrentOrganizationId } from '@/lib/tenant'
import { getPocketBase } from '@/lib/pocketbase'
import { trackOnboardingStepCompleted } from '@/lib/onboarding-analytics'
import {
  nextStepSlug,
  prevStepSlug,
  saveOnboardingStep,
  stepNumberFromSlug,
  type OnboardingStepSlug,
} from '@/lib/onboarding'
import type { AppSettings } from '@/lib/settings'

interface OnboardingBookingStepProps {
  step: OnboardingStepSlug
  settings: AppSettings
  onSaved: (settings: AppSettings, next: OnboardingStepSlug) => void
}

export default function OnboardingBookingStep({ step, settings, onSaved }: OnboardingBookingStepProps) {
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkActionDone, setLinkActionDone] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const orgId = getCurrentOrganizationId()
        const pb = getPocketBase()
        if (orgId && pb?.authStore.isValid) {
          const org = await pb.collection('organizations').getOne(orgId)
          setSlug(String(org.slug ?? ''))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const bookingLink = slug ? `${appUrl}/book/${slug}` : ''
  const brandName = settings.business_name.trim() || 'your business'

  const advanceToPlans = async () => {
    setSaving(true)
    try {
      const next = nextStepSlug(step)
      if (!next) throw new Error('Invalid step')
      const withStep = await saveOnboardingStep(stepNumberFromSlug(next), settings)
      trackOnboardingStepCompleted(step)
      onSaved(withStep, next)
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!bookingLink) return
    try {
      await navigator.clipboard.writeText(bookingLink)
      setCopied(true)
      setLinkActionDone(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleShare = async () => {
    if (!bookingLink) return
    const shareData = {
      title: `Book with ${brandName}`,
      text: `Book your next detail with ${brandName}`,
      url: bookingLink,
    }
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(shareData)
        setLinkActionDone(true)
        return
      }
      await handleCopy()
    } catch {
      /* user cancelled share */
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
      title="Booking link"
      footnote={slug && bookingLink ? 'Share on Instagram, Google Business, or anywhere clients find you.' : undefined}
      continueLabel={linkActionDone ? 'Enter Rinse' : 'Continue'}
      saving={saving}
      onBack={() => {
        const prev = prevStepSlug(step)
        if (prev) onSaved(settings, prev)
      }}
      onContinue={() => void advanceToPlans()}
    >
      {slug && appUrl && bookingLink ? (
        <>
          <p className="ob-section-label">Your link</p>
          <div className="ob-field-group onboarding-booking-link-row">
            <span className="onboarding-booking-link-row__url">{bookingLink}</span>
          </div>
          <div className="onboarding-booking-actions">
            <button
              type="button"
              className="setup-btn-secondary onboarding-booking-actions__btn"
              onClick={() => void handleCopy()}
            >
              <Copy size={18} weight="bold" aria-hidden="true" />
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <button
              type="button"
              className="setup-btn-primary onboarding-booking-actions__btn"
              onClick={() => void handleShare()}
            >
              <ShareNetwork size={18} weight="bold" aria-hidden="true" />
              Share
            </button>
          </div>
          <WebsiteBookingGuide
            appOrigin={appUrl}
            slug={slug}
            bookingUrl={bookingLink}
            brandName={settings.business_name}
            compact
          />
        </>
      ) : (
        <p className="onboarding-step__footnote" style={{ marginTop: 0 }}>
          Your booking link will appear after setup completes.
        </p>
      )}
    </OnboardingShell>
  )
}
