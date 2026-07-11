import { useState } from 'react'
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native'
import { CheckCircle } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  error,
  secureTextEntry,
  autoCapitalize,
  style,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'decimal-pad'
  multiline?: boolean
  error?: string
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  style?: ViewStyle
}) {
  const [focused, setFocused] = useState(false)
  const filled = value.trim().length > 0

  return (
    <View style={[styles.wrap, style]}>
      <AppText variant="sectionLabel" style={styles.label}>
        {label}
      </AppText>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocus,
          filled && !error && styles.fieldFilled,
          error ? styles.fieldError : null,
        ]}
      >
        <TextInput
          style={[styles.input, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? ' '}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          autoCapitalize={
            autoCapitalize ?? (keyboardType === 'email-address' ? 'none' : 'sentences')
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {filled && !error && !multiline ? (
          <CheckCircle size={18} color={colors.green} weight="fill" style={styles.check} />
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  fieldFocus: {
    borderColor: colors.green,
    backgroundColor: colors.surface,
  },
  fieldFilled: {
    borderColor: colors.greenBorder,
    backgroundColor: colors.greenSoft,
  },
  fieldError: {
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  check: {
    marginLeft: spacing.sm,
  },
  error: {
    marginTop: 4,
    color: colors.danger,
  },
})
