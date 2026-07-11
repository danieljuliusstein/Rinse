import type { CSSProperties } from 'react'
import type { ReactNode } from 'react'
import { Platform, StyleSheet, TextInput, View } from 'react-native'
import { Clock } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui'
import { formatStartTimeLabel } from '@/src/lib/home-dashboard'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

function WebTimeInput({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  if (Platform.OS !== 'web') return null
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      style={
        {
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 16,
          fontFamily: 'DM Sans, sans-serif',
          color: colors.textPrimary,
          width: '100%',
          minHeight: 24,
        } satisfies CSSProperties
      }
    />
  )
}

export function ScheduleTimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  const display = formatStartTimeLabel(value) ?? value

  return (
    <View style={styles.wrap}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.field}>
        {Platform.OS === 'web' ? (
          <WebTimeInput value={value} onChange={onChange} />
        ) : (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder="08:00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
        <Clock size={18} color={colors.textMuted} weight="duotone" />
      </View>
      {Platform.OS !== 'web' && display ? (
        <AppText variant="caption" style={styles.hint}>
          {display}
        </AppText>
      ) : null}
    </View>
  )
}

export function ScheduleTimeGrid({
  children,
}: {
  children: ReactNode
}) {
  return <View style={styles.grid}>{children}</View>
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  wrap: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  hint: {
    color: colors.textMuted,
    marginLeft: 2,
  },
})
