import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { CaretRight } from '@/src/icons'
import { AppText } from '@/src/components/ui/AppText'
import { Badge } from '@/src/components/ui/Badge'
import { PressableSurface } from '@/src/components/ui/PressableSurface'
import type { BadgeTone, ListRowIconTone } from '@/src/theme/tokens'
import { colors, iconTonePalette, layout, radii, shadows, spacing, webPressableReset } from '@/src/theme/colors'

interface ListRowProps {
  title: string
  subtitle?: string
  meta?: string
  icon?: ReactNode
  iconTone?: ListRowIconTone
  badgeLabel?: string
  badgeTone?: BadgeTone
  badges?: ReactNode
  trailing?: ReactNode
  showChevron?: boolean
  /** Align trailing with the title row (e.g. pipeline amount + menu). */
  alignTop?: boolean
  grouped?: boolean
  isLast?: boolean
  onPress?: () => void
  onLongPress?: () => void
  /** Row contains nested tap targets (menu, badges). */
  nestedInteractions?: boolean
}

export function ListRow({
  title,
  subtitle,
  meta,
  icon,
  iconTone = 'blue',
  badgeLabel,
  badgeTone,
  badges,
  trailing,
  showChevron = true,
  alignTop = false,
  grouped = false,
  isLast = false,
  onPress,
  onLongPress,
  nestedInteractions,
}: ListRowProps) {
  const tone = iconTonePalette[iconTone]
  const rowStyle = grouped
    ? [styles.rowGrouped, alignTop ? styles.rowAlignTop : null, isLast ? styles.rowGroupedLast : null]
    : [styles.row, alignTop ? styles.rowAlignTop : null]

  const row = useMemo(() => {
    const mainChildren = [
      <AppText key="title" variant="bodySemiBold" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>,
      subtitle ? (
        <AppText key="subtitle" variant="caption" numberOfLines={2} style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null,
      badgeLabel ? (
        <View key="badge" style={styles.badgeWrap}>
          <Badge tone={badgeTone} label={badgeLabel} />
        </View>
      ) : null,
      badges ? (
        <View key="badges" style={styles.badgeWrap}>
          {badges}
        </View>
      ) : null,
    ]
    const cells = [
      icon ? (
        <View key="icon" style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
          {icon}
        </View>
      ) : null,
      <View key="main" style={styles.main} children={mainChildren} />,
      trailing ? (
        <View key="trailing">{trailing}</View>
      ) : meta ? (
        <AppText key="meta" variant="caption" style={styles.meta}>
          {meta}
        </AppText>
      ) : null,
      onPress && showChevron ? (
        <View key="chevron">
          <CaretRight size={16} color={colors.textMuted} weight="bold" />
        </View>
      ) : null,
    ]
    return <View style={rowStyle} children={cells} />
  }, [
    badgeLabel,
    badgeTone,
    badges,
    icon,
    meta,
    onPress,
    rowStyle,
    showChevron,
    subtitle,
    title,
    tone.bg,
    trailing,
  ])

  if (!onPress) return row

  return (
    <PressableSurface
      onPress={onPress}
      onLongPress={onLongPress}
      nestedInteractions={nestedInteractions}
      style={[styles.pressable, grouped ? styles.pressableGrouped : null, webPressableReset]}
      children={row}
    />
  )
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
  },
  pressableGrouped: {
    marginBottom: 0,
    borderRadius: 0,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: layout.minTapTarget,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  rowGrouped: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: layout.minTapTarget,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderWidth: 0,
    width: '100%',
  },
  rowGroupedLast: {
    borderBottomWidth: 0,
  },
  rowAlignTop: {
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    flexShrink: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  badgeWrap: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  meta: {
    fontSize: 12,
    textAlign: 'right',
    maxWidth: 110,
    flexShrink: 0,
  },
})
