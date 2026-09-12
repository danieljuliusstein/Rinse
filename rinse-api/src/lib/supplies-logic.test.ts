import { describe, expect, it } from 'vitest'
import {
  filterSuppliesList,
  groupSupplies,
  inventoryRowVariant,
  isOutOfStock,
  isLowStock,
} from './supplies-logic'
import type { Supply } from './types'

function supply(overrides: Partial<Supply> = {}): Supply {
  return {
    id: 's1',
    name: 'Test Supply',
    unit: 'oz',
    quantity_on_hand: 10,
    reorder_threshold: 2,
    ...overrides,
  }
}

describe('isOutOfStock', () => {
  it('returns true when quantity is zero', () => {
    expect(isOutOfStock(supply({ quantity_on_hand: 0 }))).toBe(true)
  })

  it('returns true when quantity is negative', () => {
    expect(isOutOfStock(supply({ quantity_on_hand: -1 }))).toBe(true)
  })

  it('returns false when quantity is positive', () => {
    expect(isOutOfStock(supply({ quantity_on_hand: 1 }))).toBe(false)
  })
})

describe('inventoryRowVariant', () => {
  it('returns danger when out of stock', () => {
    expect(inventoryRowVariant(supply({ quantity_on_hand: 0 }))).toBe('danger')
  })

  it('returns warning when low but not out', () => {
    expect(inventoryRowVariant(supply({ quantity_on_hand: 2, reorder_threshold: 2 }))).toBe('warning')
  })

  it('returns empty when healthy', () => {
    expect(inventoryRowVariant(supply({ quantity_on_hand: 10, reorder_threshold: 2 }))).toBe('')
  })

  it('returns empty when no reorder threshold and in stock', () => {
    expect(inventoryRowVariant(supply({ quantity_on_hand: 5, reorder_threshold: undefined }))).toBe('')
  })
})

describe('isLowStock', () => {
  it('returns false without threshold', () => {
    expect(isLowStock(supply({ reorder_threshold: undefined }))).toBe(false)
  })
})

describe('groupSupplies', () => {
  it('splits attention and stocked items', () => {
    const items = [
      supply({ id: 'a', name: 'Alpha', quantity_on_hand: 0 }),
      supply({ id: 'b', name: 'Beta', quantity_on_hand: 10 }),
      supply({ id: 'c', name: 'Gamma', quantity_on_hand: 1, reorder_threshold: 2 }),
    ]
    const { attention, stocked } = groupSupplies(items)
    expect(attention.map((s) => s.id)).toEqual(['a', 'c'])
    expect(stocked.map((s) => s.id)).toEqual(['b'])
  })
})

describe('filterSuppliesList', () => {
  const items = [
    supply({ id: 'a', name: 'Car Soap', quantity_on_hand: 0 }),
    supply({ id: 'b', name: 'Tire Gel', quantity_on_hand: 1, reorder_threshold: 3 }),
    supply({ id: 'c', name: 'Wax', quantity_on_hand: 20, reorder_threshold: 2 }),
  ]

  it('filters by search query', () => {
    expect(filterSuppliesList(items, 'wax', 'all').map((s) => s.id)).toEqual(['c'])
  })

  it('filters low chip', () => {
    expect(filterSuppliesList(items, '', 'low').map((s) => s.id)).toEqual(['b'])
  })

  it('filters out chip', () => {
    expect(filterSuppliesList(items, '', 'out').map((s) => s.id)).toEqual(['a'])
  })
})
