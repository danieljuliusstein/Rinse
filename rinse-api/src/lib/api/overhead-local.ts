import { overheadAmountForRange } from '../supplies-logic'
import { loadData, newId, saveData } from '../storage'
import type { DateRangeKey } from './reports'
import type { OverheadExpense, OverheadInput } from '../types'

export function getOverheadExpenses(): OverheadExpense[] {
  return loadData().overhead_expenses
}

export function getOverheadExpense(id: string): OverheadExpense | null {
  return loadData().overhead_expenses.find((e) => e.id === id) ?? null
}

export function createOverheadExpense(input: OverheadInput): OverheadExpense {
  const data = loadData()
  const expense: OverheadExpense = { id: newId(), ...input }
  data.overhead_expenses.push(expense)
  saveData(data)
  return expense
}

export function updateOverheadExpense(id: string, input: Partial<OverheadInput>): OverheadExpense | null {
  const data = loadData()
  const idx = data.overhead_expenses.findIndex((e) => e.id === id)
  if (idx === -1) return null
  data.overhead_expenses[idx] = { ...data.overhead_expenses[idx], ...input }
  saveData(data)
  return data.overhead_expenses[idx]
}

export function deleteOverheadExpense(id: string): boolean {
  const data = loadData()
  const before = data.overhead_expenses.length
  data.overhead_expenses = data.overhead_expenses.filter((e) => e.id !== id)
  if (data.overhead_expenses.length === before) return false
  saveData(data)
  return true
}

export function getMonthlyOverheadTotal(): number {
  return getOverheadExpenses()
    .filter((e) => (e.billing_cycle ?? 'monthly') === 'monthly')
    .reduce((s, e) => s + e.amount, 0)
}

export function getOverheadForRange(range: DateRangeKey): number {
  return overheadAmountForRange(getOverheadExpenses(), range)
}
