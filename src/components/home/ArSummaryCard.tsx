import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Receipt } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui'
import { formatMoney } from '@/src/lib/inventory-utils'
import type { ArSummary } from '@/src/lib/ar-metrics'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type ArSummaryCardProps = {
  summary: ArSummary
}

export function ArSummaryCard({ summary }: ArSummaryCardProps) {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push('/(tabs)/invoices')}
      accessibilityRole="button"
      accessibilityLabel={t('home.viewInvoices')}
    >
      <View style={styles.cardInner}>
        <View style={styles.iconWrap}>
          <Receipt size={20} color="#c67a2e" weight="duotone" />
        </View>

        <View style={styles.body}>
          <View style={styles.labelRow}>
            <AppText variant="sectionLabel" style={styles.colLabel}>
              {t('home.outstanding')}
            </AppText>
            <AppText variant="sectionLabel" style={[styles.colLabel, styles.colLabelRight]}>
              {t('home.invoiced')}
            </AppText>
          </View>

          <View style={styles.valueRow}>
            <View style={styles.amountRow}>
              <AppText style={styles.amount}>{formatMoney(summary.unpaid)}</AppText>
              <AppText variant="caption" style={styles.unpaid}>
                {t('home.unpaid')}
              </AppText>
            </View>
            <AppText style={styles.invoicedAmount}>{formatMoney(summary.totalInvoiced)}</AppText>
          </View>

          <AppText variant="caption" style={styles.meta}>
            {t('home.openCount', { count: summary.openCount })}
          </AppText>

          {summary.collectedThisMonth > 0 ? (
            <View style={styles.collectedRow}>
              <AppText style={styles.collectedAmount}>{formatMoney(summary.collectedThisMonth)}</AppText>
              <AppText variant="caption">{t('home.collectedThisMonth')}</AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fbe8d5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  colLabel: {
    flex: 1,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  colLabelRight: {
    textAlign: 'right',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  amount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 22,
    color: colors.text,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  unpaid: {
    fontSize: 14,
    color: colors.textMuted,
  },
  invoicedAmount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  meta: {
    marginTop: 2,
  },
  collectedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  collectedAmount: {
    fontFamily: fonts.bodySemiBold,
    color: colors.green,
    fontSize: 13,
  },
})
