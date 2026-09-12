import { useEffect, useMemo, useState } from 'react'
import { Share, StyleSheet, View } from 'react-native'
import { OnboardingShell } from '@/src/components/onboarding/OnboardingShell'
import { WebsiteBookingGuide } from '@/src/components/settings/WebsiteBookingGuide'
import { AppText, PrimaryButton, ScreenLoading, SecondaryButton, SectionGroup } from '@/src/components/ui'
import { bookingPageUrl } from '@/src/lib/booking-embed'
import {
  nextStepSlug,
  prevStepSlug,
  saveOnboardingStep,
  stepNumberFromSlug,
  type OnboardingStepSlug,
} from '@/src/lib/onboarding'
import { appOrigin, loadOrganizationSlug } from '@/src/lib/org-slug'
import type { AppSettings } from '@/src/lib/settings-store'
import { copyTextToClipboard } from '@/src/lib/share'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

function truncateMiddle(url: string, max = 42): string {
  if (url.length <= max) return url
  const half = Math.floor((max - 1) / 2)
  return `${url.slice(0, half)}…${url.slice(-half)}`
}

export function OnboardingBookingStep({
  step,
  settings,
  onSaved,
}: {
  step: OnboardingStepSlug
  settings: AppSettings
  onSaved: (settings: AppSettings, next: OnboardingStepSlug) => void
}) {
  const [slug, setSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkActionDone, setLinkActionDone] = useState(false)

  useEffect(() => {
    void loadOrganizationSlug()
      .then(setSlug)
      .catch(() => setLoadError('Could not load your booking link. Check your connection.'))
      .finally(() => setLoading(false))
  }, [])

  const origin = appOrigin()
  const bookingLink = useMemo(() => (slug ? bookingPageUrl(origin, slug) : ''), [origin, slug])
  const brandName = settings.business_name.trim() || 'Your business'

  const advanceToPlans = async () => {
    setSaving(true)
    try {
      const next = nextStepSlug(step)
      if (!next) throw new Error('Invalid step')
      const withStep = await saveOnboardingStep(stepNumberFromSlug(next), settings)
      onSaved(withStep, next)
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!bookingLink) return
    try {
      await copyTextToClipboard(bookingLink, 'Link copied')
      setCopied(true)
      setLinkActionDone(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleShare = async () => {
    if (!bookingLink) return
    try {
      await Share.share({
        title: `Book with ${brandName}`,
        message: `Book your next detail with ${brandName}\n${bookingLink}`,
        url: bookingLink,
      })
      setLinkActionDone(true)
    } catch {
      /* cancelled */
    }
  }

  if (loading) return <ScreenLoading variant="list" />

  return (
    <OnboardingShell
      step={step}
      title="Booking link"
      footnote={slug && bookingLink ? 'Share on Instagram, Google Business, or anywhere clients find you.' : undefined}
      continueLabel={linkActionDone ? 'Finish setup' : 'Continue'}
      saving={saving}
      onBack={() => {
        const prev = prevStepSlug(step)
        if (prev) onSaved(settings, prev)
      }}
      onContinue={() => void advanceToPlans()}
    >
      {loadError ? (
        <AppText variant="caption" style={styles.error}>
          {loadError}
        </AppText>
      ) : null}

      {slug && bookingLink ? (
        <View style={styles.content}>
          <AppText variant="h2" style={styles.headline}>
            Your booking link is live
          </AppText>
          <AppText style={styles.lead}>{brandName} is ready for clients — share your link anywhere.</AppText>

          <SectionGroup title="Your link" grouped={false}>
            <View style={styles.linkCard}>
              <AppText style={styles.linkUrl} numberOfLines={2}>
                {truncateMiddle(bookingLink, 56)}
              </AppText>
            </View>

            <View style={styles.actions}>
              <SecondaryButton
                label={copied ? 'Link copied' : 'Copy link'}
                onPress={() => void handleCopy()}
                style={styles.actionBtn}
              />
              <PrimaryButton label="Share" onPress={() => void handleShare()} style={styles.actionBtn} />
            </View>
          </SectionGroup>

          <WebsiteBookingGuide
            appOrigin={origin}
            slug={slug}
            bookingUrl={bookingLink}
            brandName={settings.business_name}
          />
        </View>
      ) : (
        <AppText style={styles.placeholder}>Your booking link will appear after setup completes.</AppText>
      )}
    </OnboardingShell>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  headline: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    lineHeight: 28,
  },
  lead: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: -spacing.sm,
  },
  linkCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
  },
  linkUrl: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
  },
})
