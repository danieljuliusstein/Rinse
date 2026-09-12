import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { HomeScreenSkeleton, ListScreenSkeleton } from '@/src/components/ui/ScreenSkeletons'
import { colors, spacing } from '@/src/theme/colors'

export type ScreenLoadingVariant = 'list' | 'home' | 'spinner'

interface ScreenLoadingProps {
  label?: string
  variant?: ScreenLoadingVariant
}

export function ScreenLoading({ label = 'Loading…', variant = 'list' }: ScreenLoadingProps) {
  if (variant === 'home') {
    return (
      <View style={styles.root}>
        <HomeScreenSkeleton />
      </View>
    )
  }

  if (variant === 'list') {
    return (
      <View style={styles.root}>
        <ListScreenSkeleton />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.green} />
      <AppText variant="caption">{label}</AppText>
    </View>
  )
}

/** Alias used by detail screens and route shells. */
export const LoadingState = ScreenLoading

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
})
