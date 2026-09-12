import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native'
import { typography } from '@/src/theme/typography'

export type AppTextVariant = keyof typeof typography

interface AppTextProps extends TextProps {
  variant?: AppTextVariant
}

/** Custom font files already encode weight — drop fontWeight on web to avoid faux-bold stretch. */
function resolveTextStyle(variant: AppTextVariant, style?: TextStyle): TextStyle {
  const merged = StyleSheet.flatten([typography[variant], style]) as TextStyle
  if (Platform.OS === 'web' && merged.fontFamily && merged.fontWeight != null) {
    const { fontWeight: _drop, ...rest } = merged
    return rest
  }
  return merged
}

export function AppText({ variant = 'body', style, ...props }: AppTextProps) {
  return <Text {...props} style={resolveTextStyle(variant, style as TextStyle)} />
}
