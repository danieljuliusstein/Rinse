import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { FileText, PaperPlaneTilt, Plus } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui'
import { colors, radii, spacing } from '@/src/theme/colors'

export function HomeCtaRow() {
  const router = useRouter()

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        onPress={() => router.push('/invoices/new')}
        accessibilityRole="button"
        accessibilityLabel="Send invoice"
      >
        <View style={styles.ctaInner}>
          <PaperPlaneTilt size={18} color="#fff" weight="fill" />
          <AppText style={styles.primaryLabel}>Send invoice</AppText>
        </View>
      </Pressable>

      <View style={styles.secondaryRow}>
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => router.push('/jobs/new')}
          accessibilityRole="button"
        >
          <View style={styles.ctaInner}>
            <Plus size={18} color={colors.text} weight="bold" />
            <AppText style={styles.secondaryLabel}>New job</AppText>
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => router.push('/quotes/new')}
          accessibilityRole="button"
          accessibilityLabel="New quote"
        >
          <View style={styles.ctaInner}>
            <FileText size={18} color={colors.text} weight="duotone" />
            <AppText style={styles.secondaryLabel}>New quote</AppText>
          </View>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  primary: {
    backgroundColor: colors.green,
    borderRadius: radii.sheet,
    paddingVertical: 15,
    paddingHorizontal: spacing.md,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 15,
    paddingHorizontal: spacing.sm,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pressed: {
    opacity: 0.88,
  },
})
