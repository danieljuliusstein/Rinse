import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'
import { fmt, fmtDetailed, fmtLineItem, isLoss } from '@rinse/core'
import { AppText } from './AppText'
import { colors } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

/** Matches PWA `CurrencyAmount` — DM Sans tabular, not Syne display. */
export type CurrencyVariant = 'revenue' | 'expense' | 'profit' | 'balance' | 'neutral'
export type CurrencyPrecision = 'macro' | 'line-item' | 'detailed'
export type CurrencySize = 'default' | 'stat' | 'hero'

export interface CurrencyAmountProps {
  value: number
  variant?: CurrencyVariant
  precision?: CurrencyPrecision
  size?: CurrencySize
  unsigned?: boolean
  style?: StyleProp<TextStyle>
}

function formatAmount(value: number, precision: CurrencyPrecision, unsigned: boolean): string {
  if (unsigned) {
    return fmt(Math.abs(value), { decimals: precision === 'detailed' ? 2 : 0 })
  }
  switch (precision) {
    case 'line-item':
      return fmtLineItem(value)
    case 'detailed':
      return fmtDetailed(value, value < 0)
    case 'macro':
    default:
      return fmt(value)
  }
}

function colorFor(variant: CurrencyVariant, value: number, unsigned: boolean): string {
  const displayValue = unsigned ? Math.abs(value) : value
  switch (variant) {
    case 'revenue':
      return colors.greenText
    case 'expense':
      return colors.danger
    case 'profit':
      return isLoss(displayValue) ? colors.danger : colors.greenText
    case 'balance':
      return displayValue > 0 ? colors.textSecondary : colors.textPrimary
    case 'neutral':
    default:
      return isLoss(displayValue) ? colors.danger : colors.textPrimary
  }
}

const sizeStyles = StyleSheet.create({
  default: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  stat: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  hero: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 32,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
  },
})

export function CurrencyAmount({
  value,
  variant = 'neutral',
  precision = 'macro',
  size = 'default',
  unsigned = false,
  style,
}: CurrencyAmountProps) {
  return (
    <AppText style={[sizeStyles[size], { color: colorFor(variant, value, unsigned) }, style]}>
      {formatAmount(value, precision, unsigned)}
    </AppText>
  )
}
