import { StyleSheet, Switch, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { colors, layout, spacing } from '@/src/theme/colors'

interface SettingsToggleRowProps {
  label: string
  hint?: string
  value: boolean
  onChange: (value: boolean) => void
  showDivider?: boolean
  disabled?: boolean
}

export function SettingsToggleRow({
  label,
  hint,
  value,
  onChange,
  showDivider = false,
  disabled = false,
}: SettingsToggleRowProps) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.copy}>
          <AppText variant="bodyMedium" style={styles.label}>
            {label}
          </AppText>
          {hint ? <AppText style={styles.hint}>{hint}</AppText> : null}
        </View>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ true: colors.green, false: colors.border }}
          thumbColor="#ffffff"
        />
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </>
  )
}

export function SettingsPanelDivider() {
  return <View style={styles.sectionDivider} />
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: layout.minTapTarget,
    paddingVertical: 4,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 14,
    lineHeight: 19,
  },
  hint: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
})
