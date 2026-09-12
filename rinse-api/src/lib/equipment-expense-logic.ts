import type { BusinessExpense } from './types'

export function isEquipmentExpense(expense: BusinessExpense): boolean {
  return Boolean(expense.equipment_id)
}

/** Most recent expense per equipment id */
export function expenseByEquipmentId(expenses: BusinessExpense[]): Map<string, BusinessExpense> {
  const map = new Map<string, BusinessExpense>()
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date))
  for (const expense of sorted) {
    if (expense.equipment_id && !map.has(expense.equipment_id)) {
      map.set(expense.equipment_id, expense)
    }
  }
  return map
}

export function equipmentHasExpense(
  equipmentId: string,
  expenseMap: Map<string, BusinessExpense>
): boolean {
  return expenseMap.has(equipmentId)
}
