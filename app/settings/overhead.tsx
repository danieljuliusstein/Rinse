import { useCallback, useState } from 'react'
import { Alert, RefreshControl, ScrollView, StyleSheet } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Plus, Wallet } from 'phosphor-react-native'
import type { BillingCycle, OverheadCategory, OverheadExpense } from '@rinse/core'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { OverheadExpenseSheet } from '@/src/components/expenses/OverheadExpenseSheet'
import {
  AppText,
  Card,
  CurrencyAmount,
  EmptyState,
  ListRow,
  ScreenLoading,
  SectionGroup,
} from '@/src/components/ui'
import { IconHeaderButton } from '@/src/components/ui/IconHeaderButton'
import {
  createOverheadExpense,
  deleteOverheadExpense,
  getMonthlyOverheadTotal,
  listOverheadExpenses,
} from '@/src/lib/packages-api'
import { colors, spacing } from '@/src/theme/colors'

const cycleLabel: Record<BillingCycle, string> = {
  monthly: '/mo',
  annual: '/yr',
  one_time: 'one-time',
}

export default function SettingsOverheadScreen() {
  const [items, setItems] = useState<OverheadExpense[]>([])
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [list, total] = await Promise.all([listOverheadExpenses(), getMonthlyOverheadTotal()])
      setItems(list)
      setMonthlyTotal(total)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  const handleAdd = async (input: {
    name: string
    amount: number
    category: OverheadCategory
    billing_cycle: BillingCycle
  }) => {
    setSaving(true)
    try {
      await createOverheadExpense(input)
      setSheetOpen(false)
      await load(true)
    } catch (e) {
      Alert.alert('Overhead', e instanceof Error ? e.message : 'Could not add expense')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (expense: OverheadExpense) => {
    Alert.alert('Delete expense?', `Delete "${expense.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteOverheadExpense(expense.id)
            .then(() => load(true))
            .catch((e) => Alert.alert('Overhead', e instanceof Error ? e.message : 'Could not delete'))
        },
      },
    ])
  }

  const headerRight = (
    <IconHeaderButton label="Add overhead expense" onPress={() => setSheetOpen(true)}>
      <Plus size={18} color={colors.textSecondary} weight="bold" />
    </IconHeaderButton>
  )

  return (
    <SettingsScreen title="Overhead" headerRight={headerRight}>
      {loading ? (
        <ScreenLoading variant="list" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />
          }
        >
          <Card style={styles.hero}>
            <AppText variant="caption" style={styles.heroLabel}>
              Monthly recurring
            </AppText>
            <CurrencyAmount value={monthlyTotal} variant="expense" precision="detailed" size="stat" />
          </Card>

          {items.length === 0 ? (
            <EmptyState
              title="No overhead expenses"
              description="Track insurance, software, vehicle costs, and other recurring bills."
              actionLabel="Add expense"
              onAction={() => setSheetOpen(true)}
            />
          ) : (
            <SectionGroup title="All overhead">
              {items.map((expense) => (
                <ListRow
                  key={expense.id}
                  icon={<Wallet size={18} color={colors.amber} weight="duotone" />}
                  iconTone="amber"
                  title={expense.name}
                  subtitle={`${expense.category ?? 'other'} · ${cycleLabel[expense.billing_cycle ?? 'monthly']}`}
                  trailing={<CurrencyAmount value={expense.amount} variant="expense" precision="detailed" />}
                  onPress={() => handleDelete(expense)}
                />
              ))}
            </SectionGroup>
          )}
        </ScrollView>
      )}

      <OverheadExpenseSheet
        visible={sheetOpen}
        saving={saving}
        onClose={() => setSheetOpen(false)}
        onSave={(input) => void handleAdd(input)}
      />
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    marginBottom: 0,
    gap: 4,
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
})
