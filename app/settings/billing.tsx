import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Check } from 'phosphor-react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import {
  AppText,
  Card,
  PlanBadge,
  PrimaryButton,
  resolvePlanBadgeKind,
  ScreenLoading,
  SecondaryButton,
} from '@/src/components/ui'
import { SignOutBlockedError } from '@/src/lib/auth'
import { openManageSubscription } from '@/src/lib/billing-web'
import { IapPurchaseError, restoreApplePurchases, startStarterUpgrade } from '@/src/lib/iap-purchase'
import { PLAN_LABELS, EARLY_PLAN, FREE_PLAN, STARTER_PLAN, STARTER_TRIAL_DAYS } from '@/src/lib/plans'
import { fetchBillingPricing, upgradePriceLabel, type BillingPricing } from '@/src/lib/billing-pricing'
import { useAuth } from '@/src/providers/AuthProvider'
import { useOffline } from '@/src/providers/OfflineProvider'
import { fetchOrgSubscription } from '@/src/lib/subscription-fetch'
import {
  formatTrialLengthLabel,
  hasStarterAccess,
  isCancelGrace,
  isFoundingMember,
  isOnFreeTier,
  isVaultAccess,
  type OrgSubscription,
} from '@/src/lib/subscription-types'
import { buildBillingMailto, getBillingEmail } from '@/src/lib/support-config'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

function PlanFeatureList({ features, compact }: { features: readonly string[]; compact?: boolean }) {
  return (
    <View style={[styles.featureList, compact ? styles.featureListCompact : null]}>
      {features.map((feature) => (
        <View key={feature} style={styles.featureRow}>
          <Check size={14} color={colors.greenText} weight="bold" />
          <AppText variant="body" style={styles.featureText}>
            {feature}
          </AppText>
        </View>
      ))}
    </View>
  )
}

function subscribedOnStripe(org: OrgSubscription | null): boolean {
  if (!org || isFoundingMember(org)) return false
  return (
    org.subscription_status === 'active' ||
    org.subscription_status === 'past_due' ||
    Boolean(org.stripe_customer_id) ||
    Boolean(org.apple_original_transaction_id) ||
    org.billing_provider === 'apple'
  )
}

export default function SettingsBillingScreen() {
  const { signOut } = useAuth()
  const { pendingCount } = useOffline()
  const [org, setOrg] = useState<OrgSubscription | null>(null)
  const [pricing, setPricing] = useState<BillingPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [upgradeBusy, setUpgradeBusy] = useState(false)
  const [restoreBusy, setRestoreBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [record, ladder] = await Promise.all([fetchOrgSubscription(true), fetchBillingPricing()])
      setOrg(record)
      setPricing(ladder)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleUpgrade = () => {
    setUpgradeBusy(true)
    void (async () => {
      try {
        await startStarterUpgrade()
        await load()
        Alert.alert('Starter unlocked', 'Your subscription is active on this account.')
      } catch (e) {
        if (e instanceof IapPurchaseError && e.code === 'cancelled') return
        Alert.alert('Upgrade failed', e instanceof Error ? e.message : 'Could not complete purchase')
      } finally {
        setUpgradeBusy(false)
      }
    })()
  }

  const handleRestore = () => {
    setRestoreBusy(true)
    void (async () => {
      try {
        const ok = await restoreApplePurchases()
        await load()
        Alert.alert(
          ok ? 'Purchases restored' : 'Nothing to restore',
          ok
            ? 'Your App Store subscription is linked to this account.'
            : 'No active Starter subscription was found for this Apple ID.',
        )
      } catch (e) {
        Alert.alert('Restore failed', e instanceof Error ? e.message : 'Could not restore purchases')
      } finally {
        setRestoreBusy(false)
      }
    })()
  }

  const handleSignOut = () => {
    if (pendingCount > 0) {
      Alert.alert('Unsynced changes', 'Sync or discard pending changes before signing out.')
      return
    }
    Alert.alert(
      'Log out?',
      'Log out on this device? You can keep browsing, but your data will not load until you sign in again.',
      [
        { text: 'Stay signed in', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSigningOut(true)
              try {
                await signOut()
              } catch (e) {
                if (e instanceof SignOutBlockedError) Alert.alert('Cannot sign out', e.message)
              } finally {
                setSigningOut(false)
              }
            })()
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <SettingsScreen title="Billing">
        <ScreenLoading variant="list" />
      </SettingsScreen>
    )
  }

  const founding = org ? isFoundingMember(org) : false
  const vault = org ? isVaultAccess(org) : false
  const cancelGrace = org ? isCancelGrace(org) : false
  const starterAccess = org ? hasStarterAccess(org) : false
  const onFreeTier = org ? isOnFreeTier(org) : false
  const trialLabel = org ? formatTrialLengthLabel(org, STARTER_TRIAL_DAYS) : null
  const trialing = Boolean(trialLabel)
  const subscribed = subscribedOnStripe(org) && !vault
  const billingEmail = getBillingEmail()
  const planKind = resolvePlanBadgeKind(org)
  const currentPlanLabel = founding
    ? 'Founding'
    : vault
      ? 'Vault (read-only)'
      : PLAN_LABELS[org?.plan ?? 'free'] ?? org?.plan ?? FREE_PLAN.name
  const showPlanFeatures =
    founding || vault ? null : starterAccess && !onFreeTier
      ? org?.plan === 'early'
        ? EARLY_PLAN
        : STARTER_PLAN
      : null
  const paidPriceLabel = upgradePriceLabel(pricing)
  const earlyAvailable = pricing?.early.available === true
  const periodEnd = org?.current_period_end?.slice(0, 10)

  return (
    <SettingsScreen title="Billing">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <AppText style={styles.cardTitle}>Current plan</AppText>
            <PlanBadge kind={planKind} trialing={trialing} />
          </View>
          <AppText style={styles.lead}>
            {founding
              ? 'You’re on a founding member plan with lifetime access.'
              : vault
                ? 'Subscription canceled. Your data stays readable forever — export anytime. Resubscribe to create or edit again. No further charges while canceled.'
                : `Plan: ${currentPlanLabel}`}
          </AppText>
          {!founding && trialLabel ? (
            <AppText variant="caption" style={styles.statusLine}>
              {trialLabel}
              {org?.trial_ends_at ? ` · ends ${org.trial_ends_at.slice(0, 10)}` : ''}
            </AppText>
          ) : null}
          {!founding && cancelGrace && periodEnd ? (
            <AppText variant="caption" style={styles.statusLine}>
              Access until {periodEnd}, then read-only vault. No charge after that date.
            </AppText>
          ) : null}
          {!founding && !cancelGrace && periodEnd && subscribed ? (
            <AppText variant="caption" style={styles.statusLine}>
              Renews {periodEnd}
            </AppText>
          ) : null}
          {!founding && vault && org?.canceled_at ? (
            <AppText variant="caption" style={styles.statusLine}>
              Vault since {org.canceled_at.slice(0, 10)}
            </AppText>
          ) : null}
          {showPlanFeatures ? (
            <>
              <View style={styles.divider} />
              <AppText style={styles.leadTight}>{showPlanFeatures.tagline}</AppText>
              <PlanFeatureList features={showPlanFeatures.features} />
            </>
          ) : null}
        </Card>

        {!founding && (onFreeTier || vault) ? (
          <View style={styles.planStack}>
            {vault ? (
              <Card style={styles.planCardMuted}>
                <View style={styles.cardRow}>
                  <AppText style={styles.cardTitle}>Vault</AppText>
                  <PlanBadge kind="vault" />
                </View>
                <AppText style={styles.leadTight}>
                  Signed in, read-only. Export from Settings → Access and data anytime. Public booking
                  stays off until you resubscribe.
                </AppText>
              </Card>
            ) : (
              <Card style={styles.planCardMuted}>
                <View style={styles.cardRow}>
                  <AppText style={styles.cardTitle}>{FREE_PLAN.name}</AppText>
                  <PlanBadge kind="free" />
                </View>
                <Text style={styles.leadTight}>
                  <Text style={styles.price}>{FREE_PLAN.priceLabel}</Text>
                  {' — '}
                  {FREE_PLAN.tagline}
                </Text>
                <PlanFeatureList features={FREE_PLAN.features} />
              </Card>
            )}

            <Card style={styles.planCardFeatured}>
              <View style={styles.cardRow}>
                <AppText style={styles.cardTitle}>
                  {earlyAvailable ? EARLY_PLAN.name : STARTER_PLAN.name}
                </AppText>
                <PlanBadge kind={earlyAvailable ? 'early' : 'starter'} />
              </View>
              <Text style={styles.leadTight}>
                <Text style={styles.price}>{paidPriceLabel}</Text>
                {vault
                  ? ' — restore full write access'
                  : earlyAvailable
                    ? ` — locked Early price · ${pricing?.early.remaining ?? 0} seats left`
                    : ' — unlock booking, billing, pipeline, and receipt scan'}
              </Text>
              <PlanFeatureList
                features={(earlyAvailable ? EARLY_PLAN.features : STARTER_PLAN.features).slice(0, 6)}
                compact
              />
              <AppText variant="caption" style={styles.webNote}>
                {Platform.OS === 'ios'
                  ? `Billed at ${STARTER_PLAN.priceLabel} through your Apple ID. Cancel anytime in Settings → Subscriptions — you keep access until the period ends, then vault.`
                  : 'Subscribe securely via rinsehq.com (Stripe). Cancel anytime — access until period end, then read-only vault. No post-cancel charge.'}
              </AppText>
              <PrimaryButton
                label={
                  upgradeBusy
                    ? Platform.OS === 'ios'
                      ? 'Purchasing…'
                      : 'Opening checkout…'
                    : Platform.OS === 'ios'
                      ? vault
                        ? 'Resubscribe with Apple'
                        : 'Upgrade with Apple'
                      : earlyAvailable
                        ? `Upgrade · ${EARLY_PLAN.priceLabel}`
                        : vault
                          ? 'Resubscribe on rinsehq.com'
                          : 'Upgrade on rinsehq.com'
                }
                onPress={handleUpgrade}
                disabled={upgradeBusy || restoreBusy}
                style={styles.planBtn}
              />
              {Platform.OS === 'ios' ? (
                <SecondaryButton
                  label={restoreBusy ? 'Restoring…' : 'Restore purchases'}
                  onPress={handleRestore}
                  disabled={upgradeBusy || restoreBusy}
                  style={styles.planBtn}
                />
              ) : null}
            </Card>
          </View>
        ) : null}

        {!founding && subscribed ? (
          <Card style={styles.card}>
            <AppText style={styles.leadTight}>
              {cancelGrace && periodEnd
                ? `Cancel is scheduled. You keep full access until ${periodEnd}, then read-only vault forever. No charge after that date.`
                : 'Cancel anytime. You keep access until the current period ends, then your data stays in a read-only vault — no further charges.'}
            </AppText>
            <SecondaryButton
              label={
                org?.billing_provider === 'apple' || org?.apple_original_transaction_id
                  ? 'Manage App Store subscription'
                  : 'Manage subscription on rinsehq.com'
              }
              onPress={() => openManageSubscription(org)}
            />
            {Platform.OS === 'ios' &&
            !(org?.billing_provider === 'apple' || org?.apple_original_transaction_id) ? (
              <SecondaryButton
                label={restoreBusy ? 'Restoring…' : 'Restore App Store purchases'}
                onPress={handleRestore}
                disabled={restoreBusy}
                style={styles.planBtn}
              />
            ) : null}
          </Card>
        ) : null}

        <Card style={styles.card}>
          <AppText style={styles.cardTitle}>Billing help</AppText>
          <AppText style={styles.leadTight}>
            Questions about your Rinse subscription or invoices from us?
          </AppText>
          <SecondaryButton
            label={`Email ${billingEmail}`}
            onPress={() => void Linking.openURL(buildBillingMailto())}
            style={styles.planBtn}
          />
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          disabled={signingOut}
          style={({ pressed }) => [styles.logoutBtn, pressed && !signingOut ? styles.logoutPressed : null]}
        >
          <AppText variant="bodyMedium" style={styles.logoutLabel}>
            {signingOut ? 'Signing out…' : 'Log out'}
          </AppText>
        </Pressable>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  lead: {
    color: colors.textSecondary,
    lineHeight: 21,
    fontSize: 15,
  },
  leadTight: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  statusLine: {
    color: colors.textMuted,
    marginTop: 6,
  },
  webNote: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  featureList: {
    marginTop: spacing.sm,
    gap: 10,
  },
  featureListCompact: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureText: {
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  planStack: {
    gap: spacing.md,
  },
  planCardFeatured: {
    padding: spacing.md,
    gap: spacing.xs,
    borderColor: colors.green,
    borderWidth: 1,
  },
  planCardMuted: {
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.bg,
  },
  price: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  priceList: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    fontSize: 15,
  },
  planBtn: {
    marginTop: spacing.md,
  },
  logoutBtn: {
    marginTop: spacing.xs,
    paddingVertical: 13,
    borderRadius: radii.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(248, 113, 113, 0.18)',
  },
  logoutPressed: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
  },
  logoutLabel: {
    color: colors.danger,
    fontFamily: fonts.bodyMedium,
  },
})
