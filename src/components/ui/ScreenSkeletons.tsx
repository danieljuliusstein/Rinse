import { useEffect } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { colors, radii, spacing } from '@/src/theme/colors'

interface SkeletonBoxProps {
  width?: number | `${number}%`
  height: number
  radius?: number
  style?: ViewStyle
}

export function SkeletonBox({ width = '100%', height, radius = radii.md, style }: SkeletonBoxProps) {
  const reduceMotion = useReduceMotion()
  const opacity = useSharedValue(0.45)

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.55
      return
    }
    opacity.value = withRepeat(withTiming(0.9, { duration: 900 }), -1, true)
  }, [opacity, reduceMotion])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        styles.box,
        { width, height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  )
}

/** Matches `ListRow` layout for tab list first paint. */
export function ListScreenSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View style={styles.list} accessibilityRole="progressbar" accessibilityLabel="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonBox width={36} height={36} radius={radii.icon} />
          <View style={styles.rowMain}>
            <SkeletonBox width="62%" height={14} />
            <SkeletonBox width="42%" height={11} style={styles.rowSub} />
          </View>
          <SkeletonBox width={56} height={14} />
        </View>
      ))}
    </View>
  )
}

/** Home tab body — CTAs, today card, readiness/AR, calendar, list (header is real greeting). */
export function HomeScreenSkeleton() {
  return (
    <View style={styles.home} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <View style={styles.ctaRow}>
        <SkeletonBox height={48} style={styles.cta} />
        <SkeletonBox height={48} style={styles.cta} />
        <SkeletonBox width={72} height={48} />
      </View>

      <SkeletonBox height={132} radius={radii.lg} />
      <SkeletonBox height={88} radius={radii.lg} />
      <SkeletonBox height={220} radius={radii.lg} />
      <ListScreenSkeleton rows={2} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surfaceActive,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowMain: {
    flex: 1,
    gap: 8,
  },
  rowSub: {
    marginTop: 0,
  },
  home: {
    gap: spacing.md,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cta: {
    flex: 1,
  },
})
