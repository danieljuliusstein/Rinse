import { Platform, Pressable, StyleSheet, View } from 'react-native'
import { colors, radii } from '@/src/theme/colors'

export function AccentColorSwatch({
  color,
  onChange,
}: {
  color: string
  onChange: (hex: string) => void
}) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrap}>
        {/* Native color picker — web only */}
        <input
          type="color"
          value={color}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Accent color"
          style={{
            width: 44,
            height: 44,
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        />
      </View>
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Accent color swatch"
      onPress={() => {
        // Native: hex field is the editor; swatch mirrors the current color.
      }}
      style={({ pressed }) => [styles.swatch, { backgroundColor: color }, pressed ? styles.pressed : null]}
    />
  )
}

const styles = StyleSheet.create({
  webWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
})
