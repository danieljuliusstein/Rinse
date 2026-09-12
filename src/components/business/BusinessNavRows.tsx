import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { CaretRight, FileText, Receipt } from '@/src/icons'
import { AppText } from '@/src/components/ui'
import { colors, spacing, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type BusinessNavRowsProps = {
  invoicesIssued: number
  unpaidCount: number
  invoicesSubtitle: string
  openQuotes: number
  quotesSubtitle: string
}

export function BusinessNavRows({
  invoicesIssued,
  unpaidCount,
  invoicesSubtitle,
  openQuotes,
  quotesSubtitle,
}: BusinessNavRowsProps) {
  const router = useRouter()

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push('/(tabs)/invoices')}
        style={({ pressed }) => [styles.row, webPressableReset, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Invoices. ${invoicesSubtitle}`}
      >
        <View style={styles.left}>
          <View style={styles.icon}>
            <Receipt size={16} color={colors.textSecondary} weight="duotone" />
          </View>
          <AppText style={styles.title}>Invoices</AppText>
          {unpaidCount > 0 ? (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>{unpaidCount}</AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.right}>
          <AppText style={styles.sub}>{invoicesSubtitle || `${invoicesIssued} issued`}</AppText>
          <CaretRight size={18} color={colors.textDim} weight="bold" />
        </View>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        onPress={() => router.push('/(tabs)/quotes')}
        style={({ pressed }) => [styles.row, webPressableReset, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Quotes. ${quotesSubtitle}`}
      >
        <View style={styles.left}>
          <View style={styles.icon}>
            <FileText size={16} color={colors.textSecondary} weight="duotone" />
          </View>
          <AppText style={styles.title}>Quotes</AppText>
          {openQuotes > 0 ? (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>{openQuotes}</AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.right}>
          <AppText style={styles.sub}>{quotesSubtitle}</AppText>
          <CaretRight size={18} color={colors.textDim} weight="bold" />
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.bg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: '#effdf4',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: '#16a34a',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sub: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
})
