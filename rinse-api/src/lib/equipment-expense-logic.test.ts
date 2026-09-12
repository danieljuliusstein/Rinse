import { describe, expect, it } from 'vitest'
import {
  equipmentHasExpense,
  expenseByEquipmentId,
  isEquipmentExpense,
} from './equipment-expense-logic'
import type { BusinessExpense } from './types'

const base = (overrides: Partial<BusinessExpense>): BusinessExpense => ({
  id: 'e1',
  date: '2026-01-15',
  name: 'Polisher',
  amount: 450,
  category: 'equipment',
  ...overrides,
})

describe('equipment-expense-logic', () => {
  it('isEquipmentExpense when equipment_id is set', () => {
    expect(isEquipmentExpense(base({ equipment_id: 'eq1' }))).toBe(true)
    expect(isEquipmentExpense(base({}))).toBe(false)
  })

  it('expenseByEquipmentId keeps most recent per equipment', () => {
    const map = expenseByEquipmentId([
      base({ id: 'old', equipment_id: 'eq1', date: '2026-01-01' }),
      base({ id: 'new', equipment_id: 'eq1', date: '2026-02-01' }),
      base({ id: 'other', equipment_id: 'eq2', date: '2026-01-10' }),
    ])
    expect(map.get('eq1')?.id).toBe('new')
    expect(map.get('eq2')?.id).toBe('other')
    expect(equipmentHasExpense('eq1', map)).toBe(true)
    expect(equipmentHasExpense('eq9', map)).toBe(false)
  })
})
