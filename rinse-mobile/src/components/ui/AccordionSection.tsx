import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { CaretDown } from '@/src/icons'
import { AppText } from '@/src/components/ui/AppText'
import { PressableSurface } from '@/src/components/ui/PressableSurface'
import { colors, iconTonePalette, layout, radii, shadows, spacing } from '@/src/theme/colors'

interface AccordionSectionProps {
  title: string
  hint?: string
  icon?: ReactNode
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}

export function AccordionSection({
  title,
  hint,
  icon,
  expanded,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <View style={styles.card}>
      <PressableSurface
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.pressable}
      >
        <View style={styles.trigger}>
          {icon ? (
            <View style={[styles.iconTile, { backgroundColor: iconTonePalette.green.bg }]}>
              {icon}
            </View>
          ) : null}
          <View style={styles.titleBlock}>
            <AppText variant="bodySemiBold">{title}</AppText>
            {hint ? (
              <AppText variant="caption" style={styles.hint} numberOfLines={1}>
                {hint}
              </AppText>
            ) : null}
          </View>
          <View style={[styles.chevronWrap, expanded ? styles.chevronOpen : styles.chevron]}>
            <CaretDown size={19} color={colors.textMuted} />
          </View>
        </View>
      </PressableSurface>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  pressable: {
    width: '100%',
    alignSelf: 'stretch',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 65,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
  },
  iconTile: {
    width: 35,
    height: 35,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  hint: {
    color: colors.textMuted,
  },
  chevronWrap: {
    flexShrink: 0,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: spacing.sm,
    paddingBottom: 14,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
})
