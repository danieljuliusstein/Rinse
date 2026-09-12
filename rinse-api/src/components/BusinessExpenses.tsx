'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Receipt } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import BusinessExpenseSheet from '@/components/business/BusinessExpenseSheet'
import SupplyPurchaseSheet from '@/components/business/SupplyPurchaseSheet'
import { EmptyState, ListRow, SectionGroup } from '@/components/ui'
import { getBusinessExpenses, getEquipment } from '@/lib/api'
import { isEquipmentExpense } from '@/lib/equipment-expense-logic'
import { isSupplyPurchase } from '@/lib/supply-purchase-logic'
import { fmtDetailed } from '@/lib/calculations'
import type { BusinessExpense, Equipment } from '@/lib/types'

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatRowDate(date: string): string {
  const d = new Date(date.slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BusinessExpenses() {
  const router = useRouter()
  const goBack = useSettingsBack()
  const [expenses, setExpenses] = useState<BusinessExpense[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [editing, setEditing] = useState<BusinessExpense | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const equipmentById = useMemo(() => {
    const map = new Map<string, Equipment>()
    for (const item of equipment) map.set(item.id, item)
    return map
  }, [equipment])

  const load = async () => {
    const [list, equip] = await Promise.all([getBusinessExpenses(), getEquipment()])
    setExpenses([...list].sort((a, b) => b.date.localeCompare(a.date)))
    setEquipment(equip)
  }

  useEffect(() => {
    load()
  }, [])

  const monthTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      const key = monthKey(e.date)
      map.set(key, (map.get(key) ?? 0) + e.amount)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [expenses])

  const currentMonthKey = monthKey(new Date().toISOString())
  const currentMonthTotal = monthTotals.find(([k]) => k === currentMonthKey)?.[1] ?? 0

  const closeSheet = () => {
    setEditing(null)
    setShowAdd(false)
  }

  const handleSaved = async () => {
    await load()
  }

  const linkedEquipmentName = (expense: BusinessExpense) =>
    expense.equipment_id ? equipmentById.get(expense.equipment_id)?.name : undefined

  const expenseSubtitle = (expense: BusinessExpense) => {
    const parts = [formatRowDate(expense.date), expense.category ?? 'other']
    if (isSupplyPurchase(expense) && expense.quantity) parts.push(`${expense.quantity} units`)
    const equipName = isEquipmentExpense(expense) ? linkedEquipmentName(expense) : undefined
    if (equipName) parts.push(equipName)
    if (expense.vendor) parts.push(expense.vendor)
    return parts.join(' · ')
  }

  return (
    <div className="screen page-content settings-screen">
      <header className="settings-header">
        <BackButton onClick={goBack} />
        <h1 className="settings-header__title">Business expenses</h1>
        <button
          type="button"
          className="page-header__action"
          onClick={() => {
            setEditing(null)
            setShowAdd(true)
          }}
          aria-label="Add business expense"
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <div className="card business-expenses-hero">
        <div className="business-expenses-hero__label">This month</div>
        <div className="money money-negative business-expenses-hero__value">
          {fmtDetailed(currentMonthTotal)}
        </div>
      </div>

      {monthTotals.length > 0 ? (
        <SectionGroup title="By month">
          {monthTotals.map(([key, total]) => (
            <ListRow
              key={key}
              title={monthLabel(key)}
              trailing={<span className="money money-negative">{fmtDetailed(total)}</span>}
            />
          ))}
        </SectionGroup>
      ) : null}

      {expenses.length === 0 ? (
        <EmptyState
          illustration="inventory"
          title="No business expenses yet"
          description="Log rent, insurance, marketing, and other overhead."
          actionLabel="Add expense"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <SectionGroup title="All expenses">
          {expenses.map((expense) => (
            <ListRow
              key={expense.id}
              icon={<Receipt size={18} weight="duotone" />}
              iconTone="amber"
              title={expense.name}
              subtitle={expenseSubtitle(expense)}
              badge={
                isEquipmentExpense(expense) ? (
                  <span className="inv-expense-linked-badge">In inventory</span>
                ) : undefined
              }
              trailing={<span className="money money-negative">{fmtDetailed(expense.amount)}</span>}
              onClick={() => {
                setShowAdd(false)
                setEditing(expense)
              }}
            />
          ))}
        </SectionGroup>
      )}

      {showAdd && (
        <BusinessExpenseSheet expense={null} onClose={closeSheet} onSaved={handleSaved} />
      )}
      {editing && isSupplyPurchase(editing) && (
        <SupplyPurchaseSheet expense={editing} onClose={closeSheet} onSaved={handleSaved} />
      )}
      {editing && !isSupplyPurchase(editing) && (
        <BusinessExpenseSheet
          expense={editing}
          linkedEquipmentName={linkedEquipmentName(editing)}
          onViewEquipment={
            editing.equipment_id
              ? () => {
                  closeSheet()
                  router.push(`/inventory?equipment=${editing.equipment_id}`)
                }
              : undefined
          }
          onClose={closeSheet}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
