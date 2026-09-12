import { describe, expect, it } from 'vitest'
import {
  filterInventoryByExpenseTracking,
  inventoryItemInExpenses,
  supplyIdsInExpenses,
} from './inventory-expense-logic'
import type { BusinessExpense } from './types'

function expense(partial: Partial<BusinessExpense> & Pick<BusinessExpense, 'id'>): BusinessExpense {
  return {
    date: '2026-01-01',
    name: 'Test',
    amount: 10,
    ...partial,
  }
}

describe('supplyIdsInExpenses', () => {
  it('collects unique supply ids from expenses', () => {
    const ids = supplyIdsInExpenses([
      expense({ id: 'e1', supply_id: 's1', quantity: 2 }),
      expense({ id: 'e2', supply_id: 's1', quantity: 1 }),
      expense({ id: 'e3', supply_id: 's2', quantity: 1 }),
      expense({ id: 'e4', equipment_id: 'eq1' }),
    ])
    expect([...ids].sort()).toEqual(['s1', 's2'])
  })
})

describe('filterInventoryByExpenseTracking', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const tracked = new Set(['b'])

  it('returns all when filter off', () => {
    expect(filterInventoryByExpenseTracking(items, tracked, false)).toEqual(items)
  })

  it('returns only untracked when filter on', () => {
    expect(filterInventoryByExpenseTracking(items, tracked, true)).toEqual([{ id: 'a' }, { id: 'c' }])
  })
})

describe('inventoryItemInExpenses', () => {
  it('checks membership', () => {
    expect(inventoryItemInExpenses('x', new Set(['x']))).toBe(true)
    expect(inventoryItemInExpenses('y', new Set(['x']))).toBe(false)
  })
})
