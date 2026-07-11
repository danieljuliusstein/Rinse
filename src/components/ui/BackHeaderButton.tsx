import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'
import { lightHaptic } from '@/src/lib/haptics'

/** Equal side rails so the middle title stays optically centered. */
const HEADER_SIDE_WIDTH = 88

export function BackHeaderButton({ onPress, label = 'Back' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable
      onPress={() => {
        lightHaptic()
        onPress()
      }}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      children={
        <View
          style={styles.btnInner}
          children={[
            <CaretLeft key="icon" size={20} color={colors.greenText} weight="bold" />,
            <AppText key="label" variant="bodySemiBold" style={styles.label}>
              {label}
            </AppText>,
          ]}
        />
      }
    />
  )
}

export function SettingsHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string
  subtitle?: string
  onBack: () => void
  /** Optional trailing control (e.g. +). Kept in a fixed-width rail so the title stays centered. */
  right?: ReactNode
}) {
  const row = [
    <View key="left" style={styles.side}>
      <BackHeaderButton onPress={onBack} />
    </View>,
    <View key="title" style={styles.titleSlot} pointerEvents="none">
      <AppText variant="h2" style={styles.settingsTitle} numberOfLines={1}>
        {title}
      </AppText>
    </View>,
    <View key="right" style={[styles.side, styles.sideRight]}>
      {right ?? <View style={styles.sidePlaceholder} />}
    </View>,
  ]

  return (
    <View
      style={styles.settingsHeader}
      children={
        subtitle
          ? [
              <View key="row" style={styles.topRow} children={row} />,
              <AppText key="sub" variant="caption" style={styles.settingsSubtitle}>
                {subtitle}
              </AppText>,
            ]
          : [<View key="row" style={styles.topRow} children={row} />]
      }
    />
  )
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  label: {
    color: colors.greenText,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  settingsHeader: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  side: {
    width: HEADER_SIDE_WIDTH,
    minWidth: HEADER_SIDE_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  /** Keeps the empty right rail from collapsing when there is no trailing action. */
  sidePlaceholder: {
    width: HEADER_SIDE_WIDTH,
    height: 1,
  },
  titleSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  settingsTitle: {
    textAlign: 'center',
  },
  settingsSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
