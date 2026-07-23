import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { FileText, PaperPlaneTilt, Plus } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui'
import { colors, radii, spacing } from '@/src/theme/colors'

export function HomeCtaRow() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        onPress={() => router.push('/invoices/new')}
        accessibilityRole="button"
        accessibilityLabel={t('home.sendInvoice')}
      >
        <View style={styles.ctaInner}>
          <PaperPlaneTilt size={18} color="#fff" weight="fill" />
          <AppText style={styles.primaryLabel}>{t('home.sendInvoice')}</AppText>
        </View>
      </Pressable>

      <View style={styles.secondaryRow}>
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => router.push('/jobs/new')}
          accessibilityRole="button"
          accessibilityLabel={t('home.newJob')}
        >
          <View style={styles.ctaInner}>
            <Plus size={18} color={colors.text} weight="bold" />
            <AppText style={styles.secondaryLabel}>{t('home.newJob')}</AppText>
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => router.push('/quotes/new')}
          accessibilityRole="button"
          accessibilityLabel={t('home.newQuote')}
        >
          <View style={styles.ctaInner}>
            <FileText size={18} color={colors.text} weight="duotone" />
            <AppText style={styles.secondaryLabel}>{t('home.newQuote')}</AppText>
          </View>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.green,
    borderRadius: radii.md,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
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
