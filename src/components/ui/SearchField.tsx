import { forwardRef } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { MagnifyingGlass } from 'phosphor-react-native'
import { colors, spacing } from '@/src/theme/colors'

type SearchFieldProps = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'autoCapitalize' | 'autoCorrect' | 'autoFocus' | 'onBlur'
>

export const SearchField = forwardRef<TextInput, SearchFieldProps>(function SearchField(
  { placeholder = 'Search…', ...props },
  ref
) {
  return (
    <View style={styles.wrap}>
      <MagnifyingGlass size={16} color={colors.textMuted} style={styles.icon} />
      <TextInput
        ref={ref}
        {...props}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  )
})

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 16,
  },
})
