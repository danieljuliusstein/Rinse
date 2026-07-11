import { useCallback, useMemo, useState } from 'react'
import { Alert, RefreshControl, ScrollView, StyleSheet } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Plus, Receipt } from 'phosphor-react-native'
import type { BusinessExpense, BusinessExpenseInput } from '@rinse/core'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { BusinessExpenseSheet } from '@/src/components/expenses/BusinessExpenseSheet'
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
  createBusinessExpense,
  deleteBusinessExpense,
  listBusinessExpenses,
  updateBusinessExpense,
} from '@/src/lib/business-expenses-api'
import { formatExpenseDate, monthKey, monthLabel, todayIso } from '@/src/lib/expense-format'
import { colors, spacing } from '@/src/theme/colors'

export default function SettingsBusinessExpensesScreen() {
  const [expenses, setExpenses] = useState<BusinessExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<BusinessExpense | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const list = await listBusinessExpenses()
      setExpenses([...list].sort((a, b) => b.date.localeCompare(a.date)))
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

  const monthTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const expense of expenses) {
      const key = monthKey(expense.date)
      map.set(key, (map.get(key) ?? 0) + expense.amount)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [expenses])

  const currentMonthTotal = monthTotals.find(([key]) => key === monthKey(todayIso()))?.[1] ?? 0

  const openAdd = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const openEdit = (expense: BusinessExpense) => {
    setEditing(expense)
    setSheetOpen(true)
  }

  const closeSheet = () => {
    setSheetOpen(false)
    setEditing(null)
  }

  const handleSave = async (input: BusinessExpenseInput) => {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateBusinessExpense(editing.id, input)
        if (!updated) throw new Error('Could not save expense')
      } else {
        await createBusinessExpense(input)
      }
      closeSheet()
      await load(true)
    } catch (e) {
      Alert.alert('Business expense', e instanceof Error ? e.message : 'Could not save expense')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!editing) return
    Alert.alert('Delete expense?', `Delete "${editing.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true)
            try {
              const ok = await deleteBusinessExpense(editing.id)
              if (!ok) throw new Error('Could not delete expense')
              closeSheet()
              await load(true)
            } catch (e) {
              Alert.alert('Business expense', e instanceof Error ? e.message : 'Could not delete expense')
            } finally {
              setSaving(false)
            }
          })()
        },
      },
    ])
  }

  const expenseSubtitle = (expense: BusinessExpense) => {
    const parts = [formatExpenseDate(expense.date), expense.category ?? 'other']
    if (expense.vendor) parts.push(expense.vendor)
    return parts.join(' · ')
  }

  const headerRight = (
    <IconHeaderButton label="Add business expense" onPress={openAdd}>
      <Plus size={18} color={colors.textSecondary} weight="bold" />
    </IconHeaderButton>
  )

  return (
    <SettingsScreen title="Business expenses" headerRight={headerRight}>
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
              This month
            </AppText>
            <CurrencyAmount value={currentMonthTotal} variant="expense" precision="detailed" size="stat" />
          </Card>

          {monthTotals.length > 0 ? (
            <SectionGroup title="By month">
              {monthTotals.map(([key, total]) => (
                <ListRow
                  key={key}
                  title={monthLabel(key)}
                  trailing={<CurrencyAmount value={total} variant="expense" precision="detailed" />}
                />
              ))}
            </SectionGroup>
          ) : null}

          {expenses.length === 0 ? (
            <EmptyState
              title="No business expenses yet"
              description="Log rent, insurance, marketing, and other one-time costs."
              actionLabel="Add expense"
              onAction={openAdd}
            />
          ) : (
            <SectionGroup title="All expenses">
              {expenses.map((expense) => (
                <ListRow
                  key={expense.id}
                  icon={<Receipt size={18} color={colors.amber} weight="duotone" />}
                  iconTone="amber"
                  title={expense.name}
                  subtitle={expenseSubtitle(expense)}
                  trailing={<CurrencyAmount value={expense.amount} variant="expense" precision="detailed" />}
                  onPress={() => openEdit(expense)}
                />
              ))}
            </SectionGroup>
          )}
        </ScrollView>
      )}

      <BusinessExpenseSheet
        visible={sheetOpen}
        saving={saving}
        expense={editing}
        onClose={closeSheet}
        onSave={(input) => void handleSave(input)}
        onDelete={editing ? handleDelete : undefined}
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
