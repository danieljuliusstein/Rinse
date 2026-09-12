import { useCallback, useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { OnboardingBusinessStep } from '@/src/components/onboarding/OnboardingBusinessStep'
import { OnboardingYourInvoiceStep } from '@/src/components/onboarding/OnboardingYourInvoiceStep'
import { OnboardingBookingStep } from '@/src/components/onboarding/OnboardingBookingStep'
import { OnboardingPlansStep } from '@/src/components/onboarding/OnboardingPlansStep'
import { AppText, PrimaryButton, ScreenLoading } from '@/src/components/ui'
import {
  loadOnboardingProgress,
  needsOnboarding,
  resolveOnboardingStep,
  skipOnboardingDev,
  type OnboardingStepSlug,
} from '@/src/lib/onboarding'
import type { AppSettings } from '@/src/lib/settings-store'
import { colors, spacing } from '@/src/theme/colors'
import { isScreenshotMode } from '@/src/lib/screenshot-mode'
import { Pressable, StyleSheet, View } from 'react-native'

function DevOnboardingSkip({ onSkipped }: { onSkipped: () => void }) {
  const [busy, setBusy] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !__DEV__ || isScreenshotMode()) return null

  return (
    <View style={devSkipStyles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip setup for development"
        disabled={busy}
        style={({ pressed }) => [devSkipStyles.btn, pressed && devSkipStyles.btnPressed]}
        onPress={() => {
          setBusy(true)
          setError('')
          void skipOnboardingDev()
            .then(onSkipped)
            .catch((e) => {
              setBusy(false)
              setError(e instanceof Error ? e.message : 'Skip failed')
            })
        }}
      >
        <AppText style={devSkipStyles.label}>{busy ? 'Skipping…' : 'Skip setup (dev)'}</AppText>
      </Pressable>
      {error ? <AppText style={devSkipStyles.error}>{error}</AppText> : null}
    </View>
  )
}

const devSkipStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    alignItems: 'flex-end',
    gap: 6,
    // RN Web: pointerEvents on style, not prop
    pointerEvents: 'box-none',
  } as const,
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  error: {
    fontSize: 11,
    color: colors.danger,
    maxWidth: 200,
    textAlign: 'right',
  },
})

export default function OnboardingScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ step?: string }>()
  const urlSlug = typeof params.step === 'string' ? params.step : null

  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [step, setStep] = useState<OnboardingStepSlug>('business')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await loadOnboardingProgress()
        if (!needsOnboarding(loaded)) {
          router.replace('/(tabs)')
          return
        }
        const resolved = resolveOnboardingStep(urlSlug, loaded)
        setSettings(loaded)
        setStep(resolved)
      } catch {
        setLoadError('Could not load setup. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    })()
  }, [router, urlSlug])

  const navigateToStep = useCallback((nextSettings: AppSettings, nextStep: OnboardingStepSlug) => {
    setSettings(nextSettings)
    setStep(nextStep)
    router.setParams({ step: nextStep })
  }, [router])

  const skipToApp = useCallback(() => {
    router.replace('/(tabs)')
  }, [router])

  const devSkip = <DevOnboardingSkip onSkipped={skipToApp} />

  if (loading || !settings) {
    if (loadError) {
      return (
        <View style={styles.errorShell}>
          {devSkip}
          <AppText style={styles.errorText}>{loadError}</AppText>
          <PrimaryButton label="Retry" onPress={() => router.replace('/onboarding')} />
        </View>
      )
    }
    return (
      <View style={styles.shell}>
        {devSkip}
        <ScreenLoading variant="list" label="Loading setup…" />
      </View>
    )
  }

  switch (step) {
    case 'business':
      return (
        <View style={styles.shell}>
          {devSkip}
          <OnboardingBusinessStep step={step} settings={settings} onSaved={navigateToStep} />
        </View>
      )
    case 'your-invoice':
      return (
        <View style={styles.shell}>
          {devSkip}
          <OnboardingYourInvoiceStep step={step} settings={settings} onSaved={navigateToStep} />
        </View>
      )
    case 'booking':
      return (
        <View style={styles.shell}>
          {devSkip}
          <OnboardingBookingStep step={step} settings={settings} onSaved={navigateToStep} />
        </View>
      )
    case 'plans':
      return (
        <View style={styles.shell}>
          {devSkip}
          <OnboardingPlansStep step={step} settings={settings} onBack={navigateToStep} />
        </View>
      )
    default:
      return (
        <View style={styles.shell}>
          {devSkip}
          <OnboardingBusinessStep step="business" settings={settings} onSaved={navigateToStep} />
        </View>
      )
  }
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  errorShell: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
    position: 'relative',
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
  },
})
