'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Wallet } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import { EmptyState, ListRow, SectionGroup } from '@/components/ui'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import { createOverheadExpense, deleteOverheadExpense, getMonthlyOverheadTotal, getOverheadExpenses } from '@/lib/api'
import { useConfirm } from '@/providers/ConfirmProvider'
import { fmtDetailed } from '@/lib/calculations'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import type { BillingCycle, OverheadCategory, OverheadExpense } from '@/lib/types'

const CATEGORIES: OverheadCategory[] = ['vehicle', 'insurance', 'equipment', 'software', 'marketing', 'other']
const CYCLES: BillingCycle[] = ['monthly', 'annual', 'one_time']

const cycleLabel: Record<BillingCycle, string> = {
  monthly: '/mo',
  annual: '/yr',
  one_time: 'one-time',
}

export default function OverheadTracker() {
  const goBack = useSettingsBack()
  const confirm = useConfirm()
  const formRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const cycleRef = useRef<HTMLSelectElement>(null)
  const [expenses, setExpenses] = useState<OverheadExpense[]>([])
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState<OverheadCategory>('other')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  const load = async () => {
    const [list, total] = await Promise.all([getOverheadExpenses(), getMonthlyOverheadTotal()])
    setExpenses(list)
    setMonthlyTotal(total)
  }
  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!showAdd) return
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(categoryRef.current)
    syncSelectFloatingLabel(cycleRef.current)
  }, [showAdd, name, amount, category, cycle])

  const handleAdd = async () => {
    if (!name.trim() || amount <= 0) return
    await createOverheadExpense({ name: name.trim(), amount, category, billing_cycle: cycle })
    setShowAdd(false)
    setName('')
    setAmount(0)
    await load()
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete expense?',
      message: 'Delete this overhead expense?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
    })
    if (!ok) return
    await deleteOverheadExpense(id)
    await load()
  }

  return (
    <div className="screen page-content settings-screen">
      <header className="settings-header">
        <BackButton onClick={goBack} />
        <h1 className="settings-header__title">Overhead</h1>
        <button
          type="button"
          className="page-header__action"
          onClick={() => setShowAdd((v) => !v)}
          aria-label="Add overhead expense"
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <div className="card business-expenses-hero">
        <div className="business-expenses-hero__label">Monthly recurring</div>
        <div className="money money-negative business-expenses-hero__value">
          {fmtDetailed(monthlyTotal)}
        </div>
      </div>

      {showAdd && (
        <div ref={formRef} className="page-form-card page-form" style={{ marginBottom: 16 }}>
          <div className="section-title">New expense</div>

          <FloatingField id="overhead-name" label="Name" filled={name.trim().length > 0}>
            <input
              id="overhead-name"
              className={`f-input${name.trim() ? ' hv' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingAffixField
            id="overhead-amount"
            label="Amount"
            filled={amount > 0}
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <div className="overhead-form-grid">
            <FloatingField id="overhead-category" label="Category" filled={Boolean(category)}>
              <select
                ref={categoryRef}
                id="overhead-category"
                className={`f-select${category ? ' hv' : ''}`}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as OverheadCategory)
                  syncSelectFloatingLabel(categoryRef.current)
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FloatingField>

            <FloatingField id="overhead-cycle" label="Billing cycle" filled={Boolean(cycle)}>
              <select
                ref={cycleRef}
                id="overhead-cycle"
                className={`f-select${cycle ? ' hv' : ''}`}
                value={cycle}
                onChange={(e) => {
                  setCycle(e.target.value as BillingCycle)
                  syncSelectFloatingLabel(cycleRef.current)
                }}
              >
                {CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FloatingField>
          </div>

          <div className="page-form-save">
            <SheetSubmitButton
              label="Add expense"
              ready={name.trim().length > 0 && amount > 0}
              onClick={() => void handleAdd()}
            />
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <EmptyState
          illustration="inventory"
          title="No overhead expenses"
          description="Track insurance, software, vehicle costs, and other recurring bills."
          actionLabel="Add expense"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <SectionGroup title="All overhead">
          {expenses.map((expense) => (
            <ListRow
              key={expense.id}
              icon={<Wallet size={18} weight="duotone" />}
              iconTone="amber"
              title={expense.name}
              subtitle={`${expense.category ?? 'other'} · ${cycleLabel[expense.billing_cycle ?? 'monthly']}`}
              trailing={
                <div className="overhead-row-trailing">
                  <span className="money money-negative">{fmtDetailed(expense.amount)}</span>
                  <button
                    type="button"
                    className="overhead-row-trailing__delete"
                    onClick={() => void handleDelete(expense.id)}
                  >
                    Delete
                  </button>
                </div>
              }
            />
          ))}
        </SectionGroup>
      )}
    </div>
  )
}
