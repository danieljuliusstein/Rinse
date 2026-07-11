import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Sparkle } from 'phosphor-react-native'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { FREE_PLAN, STARTER_PLAN } from '@/src/lib/plans'
import { confirmNativeAction } from '@/src/lib/native-dialogs'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function OnboardingPlansSheet({
  visible,
  trialDaysLeft,
  busy,
  checkoutBusy,
  error,
  onContinueFree,
  onSubscribe,
  onClose,
}: {
  visible: boolean
  trialDaysLeft: number | null
  busy: boolean
  checkoutBusy: boolean
  error: string
  onContinueFree: () => void
  onSubscribe: () => void
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const showTrialCount =
    typeof trialDaysLeft === 'number' && Number.isFinite(trialDaysLeft) && trialDaysLeft > 0
  const iosBilling = Platform.OS === 'ios'

  const handleSubscribePress = () => {
    confirmNativeAction({
      title: 'Upgrade to Starter',
      message: iosBilling
        ? `${STARTER_PLAN.priceLabel} — billed through your Apple ID. Cancel anytime in Settings → Subscriptions.`
        : `${STARTER_PLAN.priceLabel} — checkout opens in Safari.`,
      confirmLabel: iosBilling ? 'Subscribe' : 'Continue in Safari',
      onConfirm: onSubscribe,
    })
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppText variant="h2" style={styles.title}>
            Your plan
          </AppText>
          <AppText style={styles.subtitle}>Start on Free, or upgrade to Starter anytime</AppText>

          <View style={[styles.planCard, styles.planCardMuted]}>
            <View style={styles.planHead}>
              <AppText style={styles.planName}>{FREE_PLAN.name}</AppText>
              <AppText style={styles.planPrice}>{FREE_PLAN.priceLabel}</AppText>
            </View>
            <AppText style={styles.planTagline}>{FREE_PLAN.tagline}</AppText>
            {FREE_PLAN.features.map((feature) => (
              <AppText key={feature} variant="caption" style={styles.feature}>
                · {feature}
              </AppText>
            ))}
          </View>

          {showTrialCount ? (
            <View style={styles.trialRow}>
              <Sparkle size={14} color={colors.greenText} weight="fill" />
              <AppText variant="caption" style={styles.trialText}>
                {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left in Starter trial
              </AppText>
            </View>
          ) : null}

          <View style={[styles.planCard, styles.planCardFeatured]}>
            <View style={styles.planHead}>
              <AppText style={styles.planName}>{STARTER_PLAN.name}</AppText>
              <AppText style={styles.planPrice}>{STARTER_PLAN.priceLabel}</AppText>
            </View>
            <AppText style={styles.planTagline}>{STARTER_PLAN.tagline}</AppText>
            {STARTER_PLAN.features.slice(0, 6).map((feature) => (
              <AppText key={feature} variant="caption" style={styles.feature}>
                · {feature}
              </AppText>
            ))}
            <AppText variant="caption" style={styles.feature}>
              · Plus booking widget, auto-messages, receipt scan, and more
            </AppText>
          </View>

          {error ? (
            <AppText variant="caption" style={styles.error} accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={busy ? 'Starting…' : 'Continue on Free'}
            onPress={onContinueFree}
            loading={busy}
            disabled={checkoutBusy}
          />
          <SecondaryButton
            label={
              checkoutBusy
                ? iosBilling
                  ? 'Purchasing…'
                  : 'Opening checkout…'
                : 'Upgrade to Starter'
            }
            onPress={handleSubscribePress}
            disabled={checkoutBusy || busy}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 28,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trialText: {
    color: colors.greenText,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  planCardFeatured: {
    borderWidth: 2,
    borderColor: colors.green,
  },
  planCardMuted: {
    backgroundColor: colors.bg,
  },
  planHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
  },
  planPrice: {
    fontFamily: fonts.bodySemiBold,
    color: colors.greenText,
  },
  planTagline: {
    color: colors.textSecondary,
  },
  feature: {
    color: colors.textSecondary,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
})
