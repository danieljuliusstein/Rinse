import { useEffect, useState } from 'react'
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Crown, Sparkle } from 'phosphor-react-native'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { useOrgSubscription } from '@/src/hooks/useOrgSubscription'
import { IapPurchaseError, startStarterUpgrade } from '@/src/lib/iap-purchase'
import { EARLY_PLAN, FREE_PLAN, STARTER_PLAN } from '@/src/lib/plans'
import {
  fetchBillingPricing,
  upgradePriceLabel,
  type BillingPricing,
} from '@/src/lib/billing-pricing'
import { clearOrgSubscriptionCache } from '@/src/lib/subscription-fetch'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

interface PaywallSheetProps {
  visible: boolean
  mode: 'nudge' | 'lapsed' | 'free'
  featureLabel: string
  onClose: () => void
  onNotNow?: () => void
}

export function PaywallSheet({ visible, mode, featureLabel, onClose, onNotNow }: PaywallSheetProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { daysLeft, showTrialBanner, founding, refresh } = useOrgSubscription()
  const [busy, setBusy] = useState(false)
  const [pricing, setPricing] = useState<BillingPricing | null>(null)

  useEffect(() => {
    if (!visible || founding) return
    void fetchBillingPricing().then(setPricing)
  }, [visible, founding])

  const paidLabel = upgradePriceLabel(pricing)
  const earlyAvailable = pricing?.early.available === true
  const paidName = earlyAvailable ? EARLY_PLAN.name : STARTER_PLAN.name

  const lead =
    mode === 'nudge'
      ? featureLabel
        ? `Keep ${featureLabel} — upgrade to ${paidName} before your trial ends.`
        : `Upgrade to ${paidName} before your trial ends to keep full access.`
      : mode === 'free'
        ? featureLabel
          ? `${featureLabel} is on ${paidName}. Upgrade to unlock.`
          : `Upgrade to ${paidName} to unlock booking, billing, and pipeline.`
        : featureLabel
          ? `${featureLabel} requires an active ${paidName} subscription.`
          : `Subscribe to ${paidName} to unlock premium actions in Rinse.`

  const handleBilling = () => {
    onClose()
    router.push('/settings/billing')
  }

  const handleUpgrade = () => {
    if (Platform.OS !== 'ios') {
      handleBilling()
      return
    }
    setBusy(true)
    void (async () => {
      try {
        await startStarterUpgrade()
        clearOrgSubscriptionCache()
        void refresh(true)
        onClose()
      } catch (e) {
        if (e instanceof IapPurchaseError && e.code === 'cancelled') return
        handleBilling()
      } finally {
        setBusy(false)
      }
    })()
  }

  const handleNotNow = () => {
    if (onNotNow) onNotNow()
    else onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.iconWrap}>
            <Crown size={28} color={colors.greenText} weight="duotone" />
          </View>
          <AppText variant="h2" style={styles.title}>
            {mode === 'free' ? `Upgrade to ${paidName}` : 'Upgrade to keep going'}
          </AppText>
          <AppText style={styles.lead}>{lead}</AppText>

          {showTrialBanner && daysLeft != null && Number.isFinite(daysLeft) ? (
            <View style={styles.trialRow}>
              <Sparkle size={14} color={colors.greenText} weight="fill" />
              <AppText variant="caption" style={styles.trialText}>
                {daysLeft} day{daysLeft === 1 ? '' : 's'} left in trial
              </AppText>
            </View>
          ) : null}

          {founding ? (
            <AppText variant="caption" style={styles.trialText}>
              Founding member — billing waived
            </AppText>
          ) : (
            <>
              {mode === 'free' ? (
                <View style={[styles.planCard, styles.planCardMuted]}>
                  <View style={styles.planHead}>
                    <View style={styles.planCopy}>
                      <AppText style={styles.planName}>{FREE_PLAN.name}</AppText>
                      <AppText variant="caption" style={styles.planTagline}>
                        {FREE_PLAN.tagline}
                      </AppText>
                    </View>
                    <AppText style={styles.planPrice}>{FREE_PLAN.priceLabel}</AppText>
                  </View>
                </View>
              ) : null}

              <View style={[styles.planCard, styles.planCardFeatured]}>
                <View style={styles.planHead}>
                  <View style={styles.planCopy}>
                    <AppText style={styles.planName}>{paidName}</AppText>
                    <AppText variant="caption" style={styles.planTagline}>
                      {earlyAvailable ? EARLY_PLAN.tagline : STARTER_PLAN.tagline}
                    </AppText>
                  </View>
                  <AppText style={styles.planPrice}>
                    {Platform.OS === 'ios' ? STARTER_PLAN.priceLabel : paidLabel}
                  </AppText>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={
              busy
                ? 'Purchasing…'
                : Platform.OS === 'ios'
                  ? `Upgrade to ${STARTER_PLAN.name}`
                  : 'View plans & billing'
            }
            onPress={handleUpgrade}
            disabled={busy || founding}
          />
          <SecondaryButton label="Not now" onPress={handleNotNow} disabled={busy} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: spacing.md,
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
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontFamily: fonts.displayBold,
  },
  lead: {
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trialText: {
    color: colors.greenText,
    textAlign: 'center',
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
    borderColor: colors.green,
    borderWidth: 1,
  },
  planCardMuted: {
    backgroundColor: colors.bg,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  planCopy: {
    flex: 1,
    gap: 4,
  },
  planName: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
  },
  planTagline: {
    color: colors.textSecondary,
  },
  planPrice: {
    fontFamily: fonts.bodySemiBold,
    color: colors.greenText,
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
})
