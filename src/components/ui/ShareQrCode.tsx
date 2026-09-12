import { Image, Platform, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { colors, radii, spacing } from '@/src/theme/colors'

function qrImageUri(url: string, displaySize: number) {
  const pixelSize = Math.round(displaySize * (Platform.OS === 'web' ? 2 : 2.2))
  return `https://api.qrserver.com/v1/create-qr-code/?size=${pixelSize}x${pixelSize}&data=${encodeURIComponent(url)}`
}

export function ShareQrCode({
  url,
  size = 120,
  label,
}: {
  url: string
  size?: number
  label?: string
}) {
  const padding = Math.max(4, Math.round(size * 0.06))

  return (
    <View style={styles.wrap}>
      <View style={[styles.frame, { width: size, height: size, padding }]}>
        <Image
          source={{ uri: qrImageUri(url, size - padding * 2) }}
          style={styles.qr}
          resizeMode="contain"
          accessibilityLabel="QR code for payment link"
        />
      </View>
      {label ? (
        <AppText variant="caption" style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  frame: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  qr: {
    width: '100%',
    height: '100%',
  },
  label: {
    color: colors.textMuted,
    textAlign: 'center',
  },
})
