import { Check } from 'phosphor-react-native'
import { StyleSheet, TextInput, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { accentBorder, accentTint, normalizeAccentColor } from '@/src/lib/brand-color'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function BusinessFilledField({
  label,
  value,
  onChangeText,
  optional,
  keyboardType,
  multiline,
  prefix,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  optional?: boolean
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'decimal-pad'
  multiline?: boolean
  prefix?: string
}) {
  const filled = value.trim().length > 0
  const accent = normalizeAccentColor(colors.green)

  return (
    <View style={styles.wrap}>
      <AppText style={styles.label}>
        {label}
        {optional ? <AppText style={styles.optional}> (optional)</AppText> : null}
      </AppText>
      <View
        style={[
          styles.inputWrap,
          filled
            ? {
                backgroundColor: accentTint(accent, 0.08),
                borderColor: accentBorder(accent, 0.35),
              }
            : null,
        ]}
      >
        {prefix ? <AppText style={styles.prefix}>{prefix}</AppText> : null}
        <TextInput
          style={[styles.input, multiline ? styles.multiline : null, prefix ? styles.inputWithPrefix : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder=" "
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        />
        {filled ? <Check size={18} color={colors.greenText} weight="bold" /> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  optional: {
    textTransform: 'none',
    fontWeight: '400',
    letterSpacing: 0,
    fontSize: 11,
    color: colors.textMuted,
  },
  inputWrap: {
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
  inputWithPrefix: {
    paddingLeft: 0,
  },
  prefix: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
})
