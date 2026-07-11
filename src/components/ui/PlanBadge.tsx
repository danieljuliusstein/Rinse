import { StyleSheet, View } from 'react-native'
import { Crown, Leaf, Tag } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import {
  hasStarterAccess,
  isFoundingMember,
  type OrgSubscription,
} from '@/src/lib/subscription-types'
import { fonts } from '@/src/theme/typography'

export type PlanBadgeKind = 'founding' | 'starter' | 'free'

const PLAN_BADGE: Record<
  PlanBadgeKind,
  {
    label: string
    Icon: typeof Crown
    bg: string
    text: string
    border: string
    icon: string
  }
> = {
  founding: {
    label: 'Founding',
    Icon: Crown,
    bg: 'rgba(180, 120, 20, 0.12)',
    text: '#92400e',
    border: 'rgba(180, 120, 20, 0.35)',
    icon: '#b45309',
  },
  starter: {
    label: 'Starter',
    Icon: Leaf,
    bg: 'rgba(34, 197, 94, 0.14)',
    text: '#15803d',
    border: 'rgba(34, 197, 94, 0.35)',
    icon: '#15803d',
  },
  free: {
    label: 'Free',
    Icon: Tag,
    bg: 'rgba(142, 142, 147, 0.14)',
    text: '#636366',
    border: 'rgba(142, 142, 147, 0.28)',
    icon: '#8e8e93',
  },
}

/** Resolve which plan badge to show from org subscription state. */
export function resolvePlanBadgeKind(org: OrgSubscription | null): PlanBadgeKind {
  if (!org) return 'free'
  if (isFoundingMember(org)) return 'founding'
  if (hasStarterAccess(org)) return 'starter'
  return 'free'
}

export function PlanBadge({
  kind,
  /** When starter is on trial, show “Starter trial”. */
  trialing = false,
}: {
  kind: PlanBadgeKind
  trialing?: boolean
}) {
  const palette = PLAN_BADGE[kind]
  const { Icon } = palette
  const label =
    kind === 'starter' && trialing ? 'Starter trial' : palette.label

  return (
    <View
      style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}
      accessibilityRole="text"
      accessibilityLabel={`${label} plan`}
      children={[
        <Icon key="icon" size={12} color={palette.icon} weight="fill" />,
        <AppText key="label" style={[styles.label, { color: palette.text }]} numberOfLines={1}>
          {label}
        </AppText>,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
    maxWidth: 160,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
})
