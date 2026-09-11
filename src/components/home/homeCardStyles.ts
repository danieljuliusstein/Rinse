import { StyleSheet } from 'react-native'
import { colors, radii, shadows, spacing } from '@/src/theme/colors'

/** Shared operator-home surface — use for module cards, not CTAs or pills. */
export const homeCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  cardPressed: {
    backgroundColor: colors.surfaceActive,
  },
})
