import { Pressable, StyleSheet, View } from 'react-native'
import { Garage } from 'phosphor-react-native'
import { AppText, Badge } from '@/src/components/ui'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

interface RouteGarageCardProps {
  address: string
  title: string
  badgeLabel: string
  pinnedHint: string
  onPress?: () => void
}

/** Fixed start pin for day routes — not reorderable with job stops. */
export function RouteGarageCard({
  address,
  title,
  badgeLabel,
  pinnedHint,
  onPress,
}: RouteGarageCardProps) {
  const body = (
    <View style={styles.card} accessibilityRole="text">
      <View style={[styles.iconWrap, { backgroundColor: iconTonePalette.purple.bg }]}>
        <Garage size={18} color={iconTonePalette.purple.fg} weight="duotone" />
      </View>
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <AppText variant="bodySemiBold" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          <Badge tone="blue" label={badgeLabel} />
        </View>
        <AppText variant="caption" numberOfLines={2} style={styles.address}>
          {address}
        </AppText>
        <AppText variant="caption" style={styles.pinned}>
          {pinnedHint}
        </AppText>
      </View>
    </View>
  )

  if (!onPress) return body

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${address}. ${pinnedHint}`}
    >
      {body}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    // Soft “start of route” emphasis without looking like a job stop card.
    borderLeftWidth: 3,
    borderLeftColor: iconTonePalette.purple.fg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
  },
  address: {
    color: colors.textSecondary,
  },
  pinned: {
    marginTop: 2,
    color: iconTonePalette.purple.fg,
    fontWeight: '600',
  },
})
