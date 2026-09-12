import { Pressable, StyleSheet } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { colors, radii } from '@/src/theme/colors'

export function HeaderAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <AppText variant="bodySemiBold" style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.green,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
  },
})
