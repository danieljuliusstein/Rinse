import {
  applySupplyPurchaseToSupply,
  buildNewSupplyFromPurchase,
  isSupplyPurchase,
  purchaseInventoryChanged,
  reverseSupplyPurchase,
  SupplyPurchaseError,
} from '../supply-purchase-logic'
import * as businessExpensesLocal from './business-expenses-local'
import * as suppliesLocal from './supplies-local'
import type { BusinessExpense, Supply, SupplyPurchaseInput } from '../types'

function saveSupply(supply: Supply): void {
  suppliesLocal.updateSupply(supply.id, {
    quantity_on_hand: supply.quantity_on_hand,
    cost_per_unit: supply.cost_per_unit,
  })
}

export function createSupplyPurchase(input: SupplyPurchaseInput): BusinessExpense {
  if (input.quantity <= 0 || input.amount <= 0) {
    throw new SupplyPurchaseError('Quantity and total cost must be greater than zero.')
  }
  if (!input.supply_id && !input.new_supply) {
    throw new SupplyPurchaseError('Select an existing supply or add a new one.')
  }

  let supplyId = input.supply_id
  let snapshots = { snapshot_qty_on_hand: 0, snapshot_cost_per_unit: 0 }

  if (input.new_supply) {
    const supplyInput = buildNewSupplyFromPurchase(input.new_supply, input.quantity, input.amount)
    const created = suppliesLocal.createSupply(supplyInput)
    supplyId = created.id
    snapshots = { snapshot_qty_on_hand: 0, snapshot_cost_per_unit: 0 }
  } else if (supplyId) {
    const supply = suppliesLocal.getSupply(supplyId)
    if (!supply) throw new SupplyPurchaseError('Supply not found.')
    const applied = applySupplyPurchaseToSupply(supply, input.quantity, input.amount)
    snapshots = applied.snapshots
    saveSupply(applied.supply)
  }

  return businessExpensesLocal.createBusinessExpense({
    date: input.date,
    name: input.name,
    amount: input.amount,
    category: 'supplies',
    vendor: input.vendor,
    notes: input.notes,
    supply_id: supplyId,
    quantity: input.quantity,
    snapshot_qty_on_hand: snapshots.snapshot_qty_on_hand,
    snapshot_cost_per_unit: snapshots.snapshot_cost_per_unit,
  })
}

export function updateSupplyPurchase(
  id: string,
  input: Partial<SupplyPurchaseInput>
): BusinessExpense | null {
  const current = businessExpensesLocal.getBusinessExpense(id)
  if (!current) return null

  if (!isSupplyPurchase(current)) {
    return businessExpensesLocal.updateBusinessExpense(id, input)
  }

  const nextQty = input.quantity ?? current.quantity!
  const nextAmount = input.amount ?? current.amount

  if (!purchaseInventoryChanged(current, { quantity: nextQty, amount: nextAmount })) {
    return businessExpensesLocal.updateBusinessExpense(id, {
      date: input.date,
      name: input.name,
      vendor: input.vendor,
      notes: input.notes,
      amount: input.amount,
    })
  }

  const supply = suppliesLocal.getSupply(current.supply_id!)
  if (!supply) throw new SupplyPurchaseError('Linked supply not found.')

  const reversed = reverseSupplyPurchase(supply, current)
  saveSupply(reversed)

  const applied = applySupplyPurchaseToSupply(reversed, nextQty, nextAmount)
  saveSupply(applied.supply)

  return businessExpensesLocal.updateBusinessExpense(id, {
    date: input.date ?? current.date,
    name: input.name ?? current.name,
    amount: nextAmount,
    quantity: nextQty,
    vendor: input.vendor ?? current.vendor,
    notes: input.notes ?? current.notes,
    snapshot_qty_on_hand: applied.snapshots.snapshot_qty_on_hand,
    snapshot_cost_per_unit: applied.snapshots.snapshot_cost_per_unit,
  })
}

export function deleteSupplyPurchase(id: string): boolean {
  const current = businessExpensesLocal.getBusinessExpense(id)
  if (!current) return false

  if (isSupplyPurchase(current)) {
    const supply = suppliesLocal.getSupply(current.supply_id!)
    if (!supply) return false
    const reversed = reverseSupplyPurchase(supply, current)
    saveSupply(reversed)
  }

  return businessExpensesLocal.deleteBusinessExpense(id)
}
