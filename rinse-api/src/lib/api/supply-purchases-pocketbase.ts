import {
  applySupplyPurchaseToSupply,
  buildNewSupplyFromPurchase,
  isSupplyPurchase,
  purchaseInventoryChanged,
  reverseSupplyPurchase,
  SupplyPurchaseError,
} from '../supply-purchase-logic'
import * as businessExpensesPb from './business-expenses-pocketbase'
import * as suppliesPb from './supplies-pocketbase'
import type { BusinessExpense, SupplyPurchaseInput } from '../types'

export async function createSupplyPurchase(input: SupplyPurchaseInput): Promise<BusinessExpense> {
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
    const created = await suppliesPb.createSupply(supplyInput)
    supplyId = created.id
  } else if (supplyId) {
    const supply = await suppliesPb.getSupply(supplyId)
    if (!supply) throw new SupplyPurchaseError('Supply not found.')
    const applied = applySupplyPurchaseToSupply(supply, input.quantity, input.amount)
    snapshots = applied.snapshots
    await suppliesPb.updateSupply(supplyId, {
      quantity_on_hand: applied.supply.quantity_on_hand,
      cost_per_unit: applied.supply.cost_per_unit,
    })
  }

  return businessExpensesPb.createBusinessExpense({
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

export async function updateSupplyPurchase(
  id: string,
  input: Partial<SupplyPurchaseInput>
): Promise<BusinessExpense | null> {
  const current = await businessExpensesPb.getBusinessExpense(id)
  if (!current) return null

  if (!isSupplyPurchase(current)) {
    return businessExpensesPb.updateBusinessExpense(id, input)
  }

  const nextQty = input.quantity ?? current.quantity!
  const nextAmount = input.amount ?? current.amount

  if (!purchaseInventoryChanged(current, { quantity: nextQty, amount: nextAmount })) {
    return businessExpensesPb.updateBusinessExpense(id, {
      date: input.date,
      name: input.name,
      vendor: input.vendor,
      notes: input.notes,
      amount: input.amount,
    })
  }

  const supply = await suppliesPb.getSupply(current.supply_id!)
  if (!supply) throw new SupplyPurchaseError('Linked supply not found.')

  const reversed = reverseSupplyPurchase(supply, current)
  await suppliesPb.updateSupply(supply.id, {
    quantity_on_hand: reversed.quantity_on_hand,
    cost_per_unit: reversed.cost_per_unit,
  })

  const applied = applySupplyPurchaseToSupply(reversed, nextQty, nextAmount)
  await suppliesPb.updateSupply(supply.id, {
    quantity_on_hand: applied.supply.quantity_on_hand,
    cost_per_unit: applied.supply.cost_per_unit,
  })

  return businessExpensesPb.updateBusinessExpense(id, {
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

export async function deleteSupplyPurchase(id: string): Promise<boolean> {
  const current = await businessExpensesPb.getBusinessExpense(id)
  if (!current) return false

  if (isSupplyPurchase(current)) {
    const supply = await suppliesPb.getSupply(current.supply_id!)
    if (!supply) return false
    const reversed = reverseSupplyPurchase(supply, current)
    await suppliesPb.updateSupply(supply.id, {
      quantity_on_hand: reversed.quantity_on_hand,
      cost_per_unit: reversed.cost_per_unit,
    })
  }

  return businessExpensesPb.deleteBusinessExpense(id)
}
