import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingPlansSheet } from '@/src/components/onboarding/OnboardingPlansSheet'
import { OnboardingShell } from '@/src/components/onboarding/OnboardingShell'
import { AppText } from '@/src/components/ui'
import { startStarterUpgrade, IapPurchaseError } from '@/src/lib/iap-purchase'
import {
  completeOnboarding,
  prevStepSlug,
  type OnboardingStepSlug,
} from '@/src/lib/onboarding'
import { activateFreePlan, fetchOrgSubscription } from '@/src/lib/subscription-fetch'
import { trialDaysLeft, type OrgSubscription } from '@/src/lib/subscription-types'
import type { AppSettings } from '@/src/lib/settings-store'
import { FREE_PLAN, STARTER_PLAN, STARTER_TRIAL_DAYS } from '@/src/lib/plans'
import { colors } from '@/src/theme/colors'

export function OnboardingPlansStep({
  step,
  settings,
  onBack,
}: {
  step: OnboardingStepSlug
  settings: AppSettings
  onBack: (settings: AppSettings, prev: OnboardingStepSlug) => void
}) {
  const router = useRouter()
  const [org, setOrg] = useState<OrgSubscription | null>(null)
  const [sheetVisible, setSheetVisible] = useState(true)
  const [busy, setBusy] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchOrgSubscription(true).then(setOrg)
  }, [])

  const daysLeft = org ? trialDaysLeft(org) : null

  const handleContinueFree = async () => {
    setBusy(true)
    setError('')
    try {
      await activateFreePlan()
      await completeOnboarding({
        firstInvoiceCreated: Boolean(settings.onboarding_first_invoice_at),
      })
      setSheetVisible(false)
      router.replace('/(tabs)')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish setup')
    } finally {
      setBusy(false)
    }
  }

  const handleSubscribe = async () => {
    setCheckoutBusy(true)
    setError('')
    try {
      await startStarterUpgrade()
      await completeOnboarding({
        firstInvoiceCreated: Boolean(settings.onboarding_first_invoice_at),
      })
      setSheetVisible(false)
      router.replace('/(tabs)')
    } catch (e) {
      if (e instanceof IapPurchaseError && e.code === 'cancelled') return
      setError(e instanceof Error ? e.message : 'Could not start checkout')
    } finally {
      setCheckoutBusy(false)
    }
  }

  const handleSheetClose = () => {
    const prev = prevStepSlug(step)
    if (prev) {
      setSheetVisible(false)
      onBack(settings, prev)
    }
  }

  return (
    <View style={styles.root}>
      <OnboardingShell
        step={step}
        title="Your plan"
        intro="Choose how you'd like to get started."
        continueLabel="View plans"
        onBack={() => {
          const prev = prevStepSlug(step)
          if (prev) onBack(settings, prev)
        }}
        onContinue={() => setSheetVisible(true)}
      >
        <AppText style={styles.lead}>
          Start on {FREE_PLAN.name} ({FREE_PLAN.priceLabel}), or try {STARTER_PLAN.name} free for{' '}
          {STARTER_TRIAL_DAYS} days ({STARTER_PLAN.priceLabel} after) for booking, billing, and pipeline.
        </AppText>
      </OnboardingShell>

      <OnboardingPlansSheet
        visible={sheetVisible}
        trialDaysLeft={daysLeft}
        busy={busy}
        checkoutBusy={checkoutBusy}
        error={error}
        onContinueFree={() => void handleContinueFree()}
        onSubscribe={() => void handleSubscribe()}
        onClose={handleSheetClose}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  lead: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
})
