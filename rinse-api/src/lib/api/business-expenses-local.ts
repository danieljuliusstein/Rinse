import { businessExpensesTotalForDates } from '../business-expenses-logic'
import { loadData, newId, saveData } from '../storage'
import type { BusinessExpense, BusinessExpenseInput } from '../types'

export function getBusinessExpenses(): BusinessExpense[] {
  return loadData().business_expenses ?? []
}

export function getBusinessExpense(id: string): BusinessExpense | null {
  return getBusinessExpenses().find((e) => e.id === id) ?? null
}

export function createBusinessExpense(input: BusinessExpenseInput): BusinessExpense {
  const data = loadData()
  if (!data.business_expenses) data.business_expenses = []
  const expense: BusinessExpense = { id: newId(), ...input }
  data.business_expenses.unshift(expense)
  saveData(data)
  return expense
}

export function updateBusinessExpense(
  id: string,
  input: Partial<BusinessExpenseInput>
): BusinessExpense | null {
  const data = loadData()
  if (!data.business_expenses) data.business_expenses = []
  const idx = data.business_expenses.findIndex((e) => e.id === id)
  if (idx === -1) return null
  data.business_expenses[idx] = { ...data.business_expenses[idx], ...input }
  saveData(data)
  return data.business_expenses[idx]
}

export function deleteBusinessExpense(id: string): boolean {
  const data = loadData()
  if (!data.business_expenses) return false
  const before = data.business_expenses.length
  data.business_expenses = data.business_expenses.filter((e) => e.id !== id)
  if (data.business_expenses.length === before) return false
  saveData(data)
  return true
}

export function getBusinessExpensesTotalForDates(start: Date, end: Date): number {
  return businessExpensesTotalForDates(getBusinessExpenses(), start, end)
}
