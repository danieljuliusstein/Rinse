import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { Badge } from '@/src/components/ui/Badge'
import type { BadgeTone } from '@/src/theme/tokens'
import { colors, spacing } from '@/src/theme/colors'

interface DetailRowProps {
  label: string
  value: string
  icon?: ReactNode
  badge?: boolean
  badgeTone?: BadgeTone
  chip?: boolean
  isLast?: boolean
}

export function DetailRow({
  label,
  value,
  icon,
  badge,
  badgeTone = 'gray',
  chip,
  isLast,
}: DetailRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.labelWrap}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <AppText variant="body" style={styles.label}>
          {label}
        </AppText>
      </View>
      {badge ? (
        <Badge tone={badgeTone} label={value} />
      ) : chip ? (
        <View style={styles.chip}>
          <AppText variant="caption" style={styles.chipText}>
            {value}
          </AppText>
        </View>
      ) : (
        <AppText variant="bodySemiBold" style={styles.value}>
          {value}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 4,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  icon: {
    width: 17,
    alignItems: 'center',
  },
  label: {
    color: colors.textMuted,
  },
  value: {
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: spacing.sm,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.greenSoft,
  },
  chipText: {
    color: colors.greenText,
    fontWeight: '600',
  },
})
