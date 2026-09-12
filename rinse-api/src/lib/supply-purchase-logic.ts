import { costPerUnitFromPurchase, weightedAverageCostPerUnit } from './supplies-logic'
import type { BusinessExpense, Supply, SupplyInput } from './types'

export class SupplyPurchaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SupplyPurchaseError'
  }
}

export interface SupplyPurchaseSnapshots {
  snapshot_qty_on_hand: number
  snapshot_cost_per_unit: number
}

export function isSupplyPurchase(expense: BusinessExpense): boolean {
  return Boolean(expense.supply_id && expense.quantity != null && expense.quantity > 0)
}

export function canReverseSupplyPurchase(supply: Supply, expense: BusinessExpense): boolean {
  if (!isSupplyPurchase(expense)) return true
  const minRequired = (expense.snapshot_qty_on_hand ?? 0) + expense.quantity!
  return supply.quantity_on_hand >= minRequired
}

export function reverseSupplyPurchase(supply: Supply, expense: BusinessExpense): Supply {
  if (!isSupplyPurchase(expense)) return supply
  if (!canReverseSupplyPurchase(supply, expense)) {
    throw new SupplyPurchaseError(
      'Cannot change this purchase: stock from it was already used on jobs.'
    )
  }
  return {
    ...supply,
    quantity_on_hand: expense.snapshot_qty_on_hand ?? 0,
    cost_per_unit:
      expense.snapshot_cost_per_unit != null && expense.snapshot_cost_per_unit > 0
        ? expense.snapshot_cost_per_unit
        : undefined,
  }
}

export function applySupplyPurchaseToSupply(
  supply: Supply,
  quantity: number,
  totalCost: number
): { supply: Supply; snapshots: SupplyPurchaseSnapshots } {
  if (quantity <= 0) throw new SupplyPurchaseError('Quantity must be greater than zero.')

  const snapshots: SupplyPurchaseSnapshots = {
    snapshot_qty_on_hand: supply.quantity_on_hand,
    snapshot_cost_per_unit: supply.cost_per_unit ?? 0,
  }

  const costPerUnit =
    totalCost > 0
      ? weightedAverageCostPerUnit(supply.quantity_on_hand, supply.cost_per_unit, quantity, totalCost)
      : supply.cost_per_unit

  return {
    snapshots,
    supply: {
      ...supply,
      quantity_on_hand: supply.quantity_on_hand + quantity,
      cost_per_unit: costPerUnit,
    },
  }
}

export function buildNewSupplyFromPurchase(
  input: SupplyInput,
  quantity: number,
  totalCost: number
): SupplyInput {
  return {
    ...input,
    quantity_on_hand: quantity,
    cost_per_unit: totalCost > 0 ? costPerUnitFromPurchase(quantity, totalCost) : input.cost_per_unit,
  }
}

export function purchaseInventoryChanged(
  current: BusinessExpense,
  next: { quantity?: number; amount?: number }
): boolean {
  if (!isSupplyPurchase(current)) return false
  if (next.quantity != null && next.quantity !== current.quantity) return true
  if (next.amount != null && next.amount !== current.amount) return true
  return false
}
