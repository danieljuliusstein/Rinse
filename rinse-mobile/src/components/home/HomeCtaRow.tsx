import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { FileText, PaperPlaneTilt, Plus } from '@/src/icons'
import { AppText } from '@/src/components/ui'
import { colors, radii, spacing, webPressableReset } from '@/src/theme/colors'

export function HomeCtaRow() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [webPressableReset, styles.primary, pressed && styles.pressed]}
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
          style={({ pressed }) => [webPressableReset, styles.secondary, pressed && styles.pressed]}
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
          style={({ pressed }) => [webPressableReset, styles.secondary, pressed && styles.pressed]}
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
    gap: 10,
    width: '100%',
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: colors.green,
    borderRadius: radii.sheet,
    paddingVertical: 15,
    paddingHorizontal: spacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    pointerEvents: 'none',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
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
