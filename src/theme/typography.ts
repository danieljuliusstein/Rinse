import { TextStyle } from 'react-native'
import { colors } from './tokens'

export const fonts = {
  displayBold: 'Syne_700Bold',
  displaySemiBold: 'Syne_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
} as const

export const typography = {
  h1: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
  } satisfies TextStyle,
  h2: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  } satisfies TextStyle,
  bodySemiBold: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  } satisfies TextStyle,
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  } satisfies TextStyle,
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  } satisfies TextStyle,
  button: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
    color: '#ffffff',
  } satisfies TextStyle,
} as const
