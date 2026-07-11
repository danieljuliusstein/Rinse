import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useAttentionPulse } from '@/src/hooks/useMotionArchetypes'
import { colors } from '@/src/theme/colors'

interface TourSpotlightRingProps {
  size?: number
}

/** rinse-tour.css tour-ring-pulse */
export function TourSpotlightRing({ size = 56 }: TourSpotlightRingProps) {
  const pulseStyle = useAttentionPulse(true)

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }, pulseStyle]} />
      <View style={[styles.inner, { width: size - 6, height: size - 6, borderRadius: (size - 6) / 2 }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outer: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  inner: {
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    backgroundColor: 'transparent',
  },
})
