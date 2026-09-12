import { StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { PillButton } from '@/src/components/ui/PillButton'
import { colors, spacing } from '@/src/theme/colors'

export interface PillOption<T extends string> {
  value: T
  label: string
}

interface PillGroupProps<T extends string> {
  label?: string
  options: PillOption<T>[]
  value: T
  onChange: (value: T) => void
  error?: string
  /** Single horizontal row (e.g. inside a horizontal ScrollView). */
  inline?: boolean
}

export function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  inline = false,
}: PillGroupProps<T>) {
  return (
    <View style={[styles.wrap, inline ? styles.wrapInline : null]}>
      {label ? (
        <AppText variant="sectionLabel" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={[styles.row, inline ? styles.rowInline : null]}>
        {options.map((opt) => (
          <PillButton key={opt.value} option={opt} selected={value === opt.value} onSelect={onChange} />
        ))}
      </View>
      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 0,
  },
  wrapInline: {
    marginBottom: 0,
    flexShrink: 0,
  },
  label: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    // Room for pill borders + scale pop inside clipping parents (horizontal ScrollView).
    paddingVertical: 4,
  },
  rowInline: {
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
  },
})
