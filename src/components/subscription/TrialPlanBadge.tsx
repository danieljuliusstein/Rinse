import { Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { WarningCircle } from '@/src/icons'
import { useOrgSubscription } from '@/src/hooks/useOrgSubscription'
import { usePaywallGateContext } from '@/src/providers/PaywallGateProvider'
import { STARTER_PLAN } from '@/src/lib/plans'
import { isScreenshotMode } from '@/src/lib/screenshot-mode'
import { shouldShowTrialBadge } from '@/src/lib/subscription-gates'
import { colors } from '@/src/theme/colors'

type TrialPlanBadgeProps = {
  /** `inline` — home header, left of pipeline. */
  placement?: 'inline'
}

/** Trial indicator — exclamation circle in home header, left of pipeline. */
export function TrialPlanBadge({ placement = 'inline' }: TrialPlanBadgeProps) {
  const router = useRouter()
  const { org, loading, daysLeft, lapsed, vault } = useOrgSubscription()
  const { openPaywall } = usePaywallGateContext()

  if (!shouldShowTrialBadge(org, loading, daysLeft)) return null
  if (isScreenshotMode()) return null

  const urgent = lapsed || vault || (daysLeft != null && daysLeft <= 3)
  const onFree = org?.plan === 'free'

  const handlePress = () => {
    if (vault) {
      openPaywall({ mode: 'vault' })
      return
    }
    if (lapsed) {
      openPaywall({ mode: 'lapsed' })
      return
    }
    if (onFree) {
      openPaywall({ mode: 'free' })
      return
    }
    router.push('/settings/billing')
  }

  const accessibilityLabel = vault
    ? 'Read-only vault. Resubscribe to edit.'
    : lapsed
      ? 'Trial ended. Subscribe to Starter.'
      : onFree
        ? 'On Free plan. Upgrade to Starter.'
        : daysLeft != null && Number.isFinite(daysLeft)
          ? `Starter trial, ${daysLeft} days left. Open billing.`
          : `${STARTER_PLAN.name}. Open billing.`

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.iconBtn,
        placement === 'inline' ? styles.iconBtnInline : null,
        urgent ? styles.iconBtnUrgent : styles.iconBtnTrial,
        pressed ? styles.iconBtnPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <WarningCircle
        size={18}
        color={urgent ? colors.danger : colors.greenText}
        weight="duotone"
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  iconBtnInline: {
    flexShrink: 0,
  },
  iconBtnTrial: {
    backgroundColor: colors.greenSoft,
    borderColor: 'rgba(34, 197, 94, 0.22)',
  },
  iconBtnUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.22)',
  },
  iconBtnPressed: {
    opacity: 0.85,
  },
})
