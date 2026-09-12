'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Copy, ShareNetwork } from '@phosphor-icons/react'
import WebsiteBookingGuide from '@/components/settings/WebsiteBookingGuide'
import { SetupHeroBand, SetupLoadingScreen } from '@/components/setup'
import { SETUP_HERO_BOOKING } from '@/lib/setup-hero-assets'
import OnboardingShell from './OnboardingShell'
import { truncateMiddle } from '@/lib/truncate'
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
  demo?: boolean
  demoSlug?: string
}

export default function OnboardingBookingStep({
  step,
  settings,
  onSaved,
  demo = false,
  demoSlug,
}: OnboardingBookingStepProps) {
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkActionDone, setLinkActionDone] = useState(false)

  useEffect(() => {
    if (demo) {
      setSlug(demoSlug ?? 'summit-detail')
      setLoading(false)
      return
    }
    void (async () => {
      try {
        const orgId = getCurrentOrganizationId()
        const pb = getPocketBase()
        if (orgId && pb?.authStore.isValid) {
          const org = await pb.collection('organizations').getOne(orgId)
          setSlug(String(org.slug ?? ''))
        }
      } catch {
        setLoadError('Could not load your booking link. Check your connection.')
      } finally {
        setLoading(false)
      }
    })()
  }, [demo, demoSlug])

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const bookingLink = slug ? `${appUrl}/book/${slug}` : ''
  const brandName = settings.business_name.trim() || 'Your business'
  const displayLink = bookingLink ? truncateMiddle(bookingLink) : ''
  const bookingHero = SETUP_HERO_BOOKING ? (
    <SetupHeroBand src={SETUP_HERO_BOOKING} variant="compact" />
  ) : undefined

  const advanceToPlans = async () => {
    setSaving(true)
    try {
      if (demo) {
        const next = nextStepSlug(step)
        if (!next) throw new Error('Invalid step')
        onSaved(settings, next)
        return
      }
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
    return <SetupLoadingScreen variant="shell" />
  }

  return (
    <OnboardingShell
      step={step}
      settings={settings}
      title="Booking link"
      footnote={slug && bookingLink ? 'Share on Instagram, Google Business, or anywhere clients find you.' : undefined}
      continueLabel={linkActionDone ? 'Finish setup' : 'Continue'}
      saving={saving}
      hero={bookingHero}
      progressVariant={bookingHero ? 'hero' : 'default'}
      demo={demo}
      onBack={() => {
        const prev = prevStepSlug(step)
        if (prev) onSaved(settings, prev)
      }}
      onContinue={() => void advanceToPlans()}
    >
      {loadError ? (
        <p className="onboarding-error" role="alert">
          {loadError}
        </p>
      ) : null}

      {slug && appUrl && bookingLink ? (
        <>
          <h2 className="setup-step-headline">Your booking link is live</h2>
          <p className="setup-step-lead">
            {brandName} is ready for clients — share your link anywhere.
          </p>

          <p className="ob-section-label">Your link</p>
          <div className="onboarding-booking-link-card" title={bookingLink}>
            <span className="onboarding-booking-link-card__url">{displayLink}</span>
          </div>

          <div className="onboarding-booking-actions">
            <motion.button
              type="button"
              className={[
                'setup-btn-secondary',
                'onboarding-booking-actions__btn',
                copied ? 'onboarding-booking-actions__btn--success' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              animate={{ scale: copied ? [1, 0.95, 1] : 1 }}
              onClick={() => void handleCopy()}
            >
              <Copy size={18} weight="bold" aria-hidden="true" />
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    Link copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    Copy link
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
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
