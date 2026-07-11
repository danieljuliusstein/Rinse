import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft } from 'phosphor-react-native'
import { AppText, PrimaryButton } from '@/src/components/ui'
import { SetupStepIn } from '@/src/components/motion/SetupStepIn'
import {
  ONBOARDING_STEP_COUNT,
  ONBOARDING_STEP_SLUGS,
  type OnboardingStepSlug,
} from '@/src/lib/onboarding'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function OnboardingShell({
  step,
  title,
  intro,
  footnote,
  continueLabel = 'Continue',
  continueDisabled = false,
  continueHint,
  saving = false,
  showBack = true,
  secondaryAction,
  onBack,
  onContinue,
  children,
}: {
  step: OnboardingStepSlug
  title?: string
  intro?: string
  footnote?: string
  continueLabel?: string
  continueDisabled?: boolean
  continueHint?: string
  saving?: boolean
  showBack?: boolean
  secondaryAction?: ReactNode
  onBack?: () => void
  onContinue: () => void
  children: ReactNode
}) {
  const stepIdx = Math.max(0, ONBOARDING_STEP_SLUGS.indexOf(step))

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <View style={styles.nav}>
          {showBack && onBack ? (
            <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
              <ArrowLeft size={20} color={colors.textPrimary} weight="bold" />
            </Pressable>
          ) : (
            <View style={styles.navSpacer} />
          )}
          {title ? (
            <AppText style={styles.navTitle} numberOfLines={1}>
              {title}
            </AppText>
          ) : (
            <View style={styles.navTitleSpacer} />
          )}
          <View style={styles.navSpacer} />
        </View>

        <View
          style={styles.progressRow}
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${stepIdx + 1} of ${ONBOARDING_STEP_COUNT}`}
          accessibilityValue={{ min: 1, max: ONBOARDING_STEP_COUNT, now: stepIdx + 1 }}
        >
          {ONBOARDING_STEP_SLUGS.map((slug, i) => (
            <View
              key={slug}
              style={[
                styles.progressSeg,
                i <= stepIdx ? styles.progressSegOn : styles.progressSegOff,
                i === stepIdx ? styles.progressSegCurrent : null,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {intro ? <AppText style={styles.intro}>{intro}</AppText> : null}

        <SetupStepIn stepKey={step}>{children}</SetupStepIn>

        {footnote ? <AppText variant="caption" style={styles.footnote}>{footnote}</AppText> : null}
        {continueHint && continueDisabled ? (
          <AppText variant="caption" style={styles.hint}>
            {continueHint}
          </AppText>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {secondaryAction}
        <PrimaryButton
          label={saving ? 'Saving…' : continueLabel}
          onPress={onContinue}
          loading={saving}
          disabled={continueDisabled || saving}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  top: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -2,
  },
  navSpacer: {
    width: 40,
    height: 40,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
  },
  navTitleSpacer: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: radii.pill,
  },
  progressSegOn: {
    backgroundColor: colors.green,
  },
  progressSegOff: {
    backgroundColor: colors.border,
  },
  progressSegCurrent: {
    transform: [{ scaleY: 1.35 }],
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  intro: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  footnote: {
    color: colors.textMuted,
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
})
