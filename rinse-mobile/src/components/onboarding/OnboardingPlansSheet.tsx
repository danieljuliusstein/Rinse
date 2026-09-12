import { useEffect, useState } from 'react'
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Sparkle } from '@/src/icons'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { EARLY_PLAN, FREE_PLAN, FOUNDING_PLAN, STARTER_PLAN } from '@/src/lib/plans'
import {
  fetchBillingPricing,
  upgradePriceLabel,
  type BillingPricing,
} from '@/src/lib/billing-pricing'
import { confirmNativeAction } from '@/src/lib/native-dialogs'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function OnboardingPlansSheet({
  visible,
  trialDaysLeft,
  busy,
  checkoutBusy,
  error,
  isFounding,
  onContinueFree,
  onSubscribe,
  onClose,
}: {
  visible: boolean
  trialDaysLeft: number | null
  busy: boolean
  checkoutBusy: boolean
  error: string
  isFounding?: boolean
  onContinueFree: () => void
  onSubscribe: () => void
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const [pricing, setPricing] = useState<BillingPricing | null>(null)
  const showTrialCount =
    typeof trialDaysLeft === 'number' && Number.isFinite(trialDaysLeft) && trialDaysLeft > 0
  const iosBilling = Platform.OS === 'ios'
  const paidLabel = upgradePriceLabel(pricing)
  const earlyAvailable = pricing?.early.available === true
  const foundingOpen = (pricing?.founding.remaining ?? 0) > 0

  useEffect(() => {
    if (!visible) return
    void fetchBillingPricing().then(setPricing)
  }, [visible])

  const handleSubscribePress = () => {
    const planName = earlyAvailable ? EARLY_PLAN.name : STARTER_PLAN.name
    confirmNativeAction({
      title: `Upgrade to ${planName}`,
      message: iosBilling
        ? `${STARTER_PLAN.priceLabel} — billed through your Apple ID. Cancel anytime in Settings → Subscriptions.`
        : `${paidLabel} — checkout opens in Safari.`,
      confirmLabel: iosBilling ? 'Subscribe' : 'Continue in Safari',
      onConfirm: onSubscribe,
    })
  }

  if (isFounding) {
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
              You’re a founding member
            </AppText>
            <AppText style={styles.subtitle}>
              Seat claimed — {FOUNDING_PLAN.priceLabel} lifetime Starter access.
            </AppText>
            <View style={[styles.planCard, styles.planCardFeatured]}>
              <View style={styles.planHead}>
                <AppText style={styles.planName}>{FOUNDING_PLAN.name}</AppText>
                <AppText style={styles.planPrice}>{FOUNDING_PLAN.priceLabel}</AppText>
              </View>
              <AppText style={styles.planTagline}>{FOUNDING_PLAN.tagline}</AppText>
              {FOUNDING_PLAN.features.map((feature) => (
                <AppText key={feature} variant="caption" style={styles.feature}>
                  · {feature}
                </AppText>
              ))}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <PrimaryButton
              label={busy ? 'Starting…' : 'Continue'}
              onPress={onContinueFree}
              loading={busy}
            />
          </View>
        </View>
      </Modal>
    )
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
          <AppText style={styles.subtitle}>
            Free forever, or unlock Starter
            {earlyAvailable ? ` at ${EARLY_PLAN.priceLabel}` : ` at ${STARTER_PLAN.priceLabel}`}
          </AppText>

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

          {foundingOpen ? (
            <View style={styles.planCard}>
              <View style={styles.planHead}>
                <AppText style={styles.planName}>{FOUNDING_PLAN.name}</AppText>
                <AppText style={styles.planPrice}>{FOUNDING_PLAN.priceLabel}</AppText>
              </View>
              <AppText style={styles.planTagline}>
                {pricing?.founding.remaining ?? 0} of {pricing?.founding.limit ?? 20} seats left —
                claimed automatically on signup.
              </AppText>
            </View>
          ) : null}

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
              <AppText style={styles.planName}>
                {earlyAvailable ? EARLY_PLAN.name : STARTER_PLAN.name}
              </AppText>
              <AppText style={styles.planPrice}>{paidLabel}</AppText>
            </View>
            <AppText style={styles.planTagline}>
              {earlyAvailable ? EARLY_PLAN.tagline : STARTER_PLAN.tagline}
            </AppText>
            {(earlyAvailable ? EARLY_PLAN.features : STARTER_PLAN.features.slice(0, 6)).map(
              (feature) => (
                <AppText key={feature} variant="caption" style={styles.feature}>
                  · {feature}
                </AppText>
              ),
            )}
            {!earlyAvailable ? (
              <AppText variant="caption" style={styles.feature}>
                · Plus booking widget, auto-messages, receipt scan, and more
              </AppText>
            ) : (
              <AppText variant="caption" style={styles.feature}>
                · {pricing?.early.remaining ?? 0} early seats left · then {STARTER_PLAN.priceLabel}
              </AppText>
            )}
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
                : earlyAvailable
                  ? `Upgrade · ${EARLY_PLAN.priceLabel}`
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
