import type { BusinessExpense } from './types'

/** Supply ids referenced by at least one business expense (purchase/restock). */
export function supplyIdsInExpenses(expenses: BusinessExpense[]): Set<string> {
  const ids = new Set<string>()
  for (const expense of expenses) {
    if (expense.supply_id) ids.add(expense.supply_id)
  }
  return ids
}

export function inventoryItemInExpenses(id: string, trackedIds: Set<string>): boolean {
  return trackedIds.has(id)
}

export function filterInventoryByExpenseTracking<T extends { id: string }>(
  items: T[],
  trackedIds: Set<string>,
  notInExpensesOnly: boolean
): T[] {
  if (!notInExpensesOnly) return items
  return items.filter((item) => !trackedIds.has(item.id))
}
