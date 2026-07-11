import type { BusinessExpense, SupplyPurchaseInput } from '@rinse/core'
import { createBusinessExpense } from './business-expenses-api'
import { createSupply, getSupply, updateSupply } from './supplies-api'
import {
  applySupplyPurchaseToSupply,
  buildNewSupplyFromPurchase,
  SupplyPurchaseError,
} from './supply-purchase-logic'

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
    const created = await createSupply(supplyInput)
    supplyId = created.id
  } else if (supplyId) {
    const supply = await getSupply(supplyId)
    if (!supply) throw new SupplyPurchaseError('Supply not found.')
    const applied = applySupplyPurchaseToSupply(supply, input.quantity, input.amount)
    snapshots = applied.snapshots
    await updateSupply(supplyId, {
      quantity_on_hand: applied.supply.quantity_on_hand,
      cost_per_unit: applied.supply.cost_per_unit,
    })
  }

  return createBusinessExpense({
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
