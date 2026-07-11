import { Image, StyleSheet, View } from 'react-native'
import { BRAND } from '@/src/lib/brand-assets'

export function RinseLogo({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image source={BRAND.icon} style={styles.image} resizeMode="contain" />
    </View>
  )
}

export function RinseLockup({ height = 28, onDark = false }: { height?: number; onDark?: boolean }) {
  const width = Math.round(height * 3.95)
  return (
    <Image
      source={onDark ? BRAND.lockupOnDark : BRAND.lockup}
      style={{ width, height }}
      resizeMode="contain"
      accessibilityLabel="Rinse"
    />
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
})
