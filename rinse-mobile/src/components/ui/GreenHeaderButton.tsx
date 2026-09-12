import { Pressable, StyleSheet, View } from 'react-native'
import type { ReactNode } from 'react'
import { colors, webInlinePressableReset } from '@/src/theme/colors'
import { lightHaptic } from '@/src/lib/haptics'
import { HEADER_ICON_SIZE } from '@/src/components/ui/IconHeaderButton'

export function GreenHeaderButton({
  label,
  onPress,
  children,
}: {
  label: string
  onPress: () => void
  children: ReactNode
}) {
  return (
    <Pressable
      onPress={() => {
        lightHaptic()
        onPress()
      }}
      style={({ pressed }) => [styles.btn, webInlinePressableReset, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      children={<View style={styles.inner}>{children}</View>}
    />
  )
}

const styles = StyleSheet.create({
  btn: {
    width: HEADER_ICON_SIZE,
    height: HEADER_ICON_SIZE,
    borderRadius: HEADER_ICON_SIZE / 2,
    backgroundColor: colors.green,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
})
