import { useState } from 'react'
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native'
import { CheckCircle } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

interface AffixFieldProps {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  error?: string
  keyboardType?: 'decimal-pad' | 'number-pad'
  style?: ViewStyle
}

export function AffixField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'number-pad',
  style,
}: AffixFieldProps) {
  const [focused, setFocused] = useState(false)
  const filled = value.trim().length > 0

  return (
    <View style={[styles.wrap, style]}>
      <AppText variant="sectionLabel" style={styles.label}>
        {label}
      </AppText>
      <View
        style={[
          styles.row,
          focused && styles.rowFocus,
          filled && !error && styles.rowFilled,
          error ? styles.rowError : null,
        ]}
      >
        <AppText variant="bodySemiBold" style={styles.prefix}>
          $
        </AppText>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {filled && !error ? (
          <CheckCircle size={18} color={colors.green} weight="fill" />
        ) : null}
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
    flex: 1,
    minWidth: 0,
  },
  label: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    gap: 4,
  },
  rowFocus: {
    borderColor: colors.green,
    backgroundColor: colors.surface,
  },
  rowFilled: {
    borderColor: colors.greenBorder,
    backgroundColor: colors.greenSoft,
  },
  rowError: {
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  prefix: {
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  error: {
    marginTop: 4,
    color: colors.danger,
  },
})
