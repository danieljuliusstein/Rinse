import { StyleSheet, View } from 'react-native'
import { fmt } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export type ExpenseBreakdownItem = {
  id: string
  label: string
  value: number
}

const GREEN_SHADES = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#a7f3d0', '#6ee7b7']

type ExpenseBreakdownCardProps = {
  items: ExpenseBreakdownItem[]
  emptySearch?: boolean
  searchQuery?: string
}

export function ExpenseBreakdownCard({ items, emptySearch, searchQuery }: ExpenseBreakdownCardProps) {
  const positive = items.filter((i) => i.value > 0)
  const total = positive.reduce((s, i) => s + i.value, 0)
  const max = Math.max(...positive.map((i) => i.value), 1)
  const colored = positive.map((i, idx) => ({
    ...i,
    color: GREEN_SHADES[idx % GREEN_SHADES.length],
  }))

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText style={styles.title}>Expense breakdown</AppText>
        {total > 0 ? <AppText style={styles.total}>{fmt(total)} total</AppText> : null}
      </View>

      {colored.length === 0 ? (
        <AppText style={styles.empty}>
          {emptySearch && searchQuery ? `No match for “${searchQuery}”` : 'No expenses in this period.'}
        </AppText>
      ) : (
        <>
          <View style={styles.stack}>
            {colored.map((e) => (
              <View
                key={e.id}
                style={[styles.stackSeg, { flex: Math.max(e.value, 1), backgroundColor: e.color }]}
              />
            ))}
          </View>

          <View style={styles.list}>
            {colored.map((e) => {
              const pct = (e.value / max) * 100
              const sharePct = total > 0 ? Math.round((e.value / total) * 100) : 0
              return (
                <View key={e.id} style={styles.item}>
                  <View style={styles.itemTop}>
                    <View style={styles.itemLeft}>
                      <View style={[styles.dot, { backgroundColor: e.color }]} />
                      <AppText style={styles.name}>{e.label}</AppText>
                    </View>
                    <View style={styles.itemRight}>
                      <AppText style={styles.share}>{sharePct}%</AppText>
                      <AppText style={styles.amount}>{fmt(e.value)}</AppText>
                    </View>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: e.color }]} />
                  </View>
                </View>
              )
            })}
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md + 4,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  total: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  empty: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  stack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  stackSeg: {
    height: 10,
  },
  list: {
    gap: 14,
  },
  item: {
    gap: 6,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  share: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textDim,
  },
  amount: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 999,
  },
})
