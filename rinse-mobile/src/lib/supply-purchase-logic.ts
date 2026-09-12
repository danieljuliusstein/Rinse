import type { BusinessExpense, Supply, SupplyInput } from '@rinse/core'

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

export function costPerUnitFromPurchase(quantity: number, totalCost: number): number {
  if (quantity <= 0 || totalCost <= 0) return 0
  return Math.round((totalCost / quantity) * 10000) / 10000
}

export function weightedAverageCostPerUnit(
  currentQty: number,
  currentCostPerUnit: number | undefined,
  addQty: number,
  purchaseTotal: number
): number {
  if (addQty <= 0) return currentCostPerUnit ?? 0
  const purchaseCostPerUnit = purchaseTotal / addQty
  if (currentQty <= 0 || currentCostPerUnit == null || currentCostPerUnit <= 0) {
    return Math.round(purchaseCostPerUnit * 10000) / 10000
  }
  const blended = (currentQty * currentCostPerUnit + purchaseTotal) / (currentQty + addQty)
  return Math.round(blended * 10000) / 10000
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
