import { useCallback, useMemo, useState } from 'react'
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
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
  type ReceiptImageAsset,
} from '@/src/lib/business-expenses-api'
import { formatExpenseDate, monthKey, monthLabel, todayIso } from '@/src/lib/expense-format'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

export default function SettingsBusinessExpensesScreen() {
  const router = useRouter()
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

  const handleSave = async (input: BusinessExpenseInput, receipt?: ReceiptImageAsset | null) => {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateBusinessExpense(editing.id, input, receipt)
        if (!updated) throw new Error('Could not save expense')
      } else {
        await createBusinessExpense(input, receipt)
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
    if (expense.receipt_url) parts.push('Receipt')
    return parts.join(' · ')
  }

  const headerRight = (
    <View style={styles.headerActions}>
      <IconHeaderButton label="Scan receipt" onPress={() => router.push('/expenses/new?scan=1')}>
        <Receipt size={18} color={colors.textSecondary} weight="duotone" />
      </IconHeaderButton>
      <IconHeaderButton label="Add business expense" onPress={openAdd}>
        <Plus size={18} color={colors.textSecondary} weight="bold" />
      </IconHeaderButton>
    </View>
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
              {expenses.map((expense) => {
                const hasReceipt = Boolean(expense.receipt_url)
                const tone = hasReceipt ? iconTonePalette.green : iconTonePalette.amber
                return (
                  <ListRow
                    key={expense.id}
                    icon={<Receipt size={18} color={tone.fg} weight="duotone" />}
                    iconTone={hasReceipt ? 'green' : 'amber'}
                    title={expense.name}
                    subtitle={expenseSubtitle(expense)}
                    trailing={<CurrencyAmount value={expense.amount} variant="expense" precision="detailed" />}
                    onPress={() => openEdit(expense)}
                  />
                )
              })}
            </SectionGroup>
          )}
        </ScrollView>
      )}

      <BusinessExpenseSheet
        visible={sheetOpen}
        saving={saving}
        expense={editing}
        onClose={closeSheet}
        onSave={(input, receipt) => void handleSave(input, receipt)}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
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
