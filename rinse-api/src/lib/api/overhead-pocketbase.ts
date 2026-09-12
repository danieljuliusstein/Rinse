import { overheadAmountForRange } from '../supplies-logic'
import { getPocketBase } from '../pocketbase'
import { appOverheadToPb, pbOverheadToApp, type PbRecord } from './mappers'
import { withOrganization } from './tenant-pocketbase'
import type { DateRangeKey } from './reports'
import type { OverheadExpense, OverheadInput } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

export async function getOverheadExpenses(): Promise<OverheadExpense[]> {
  const records = await pb().collection('overhead_expenses').getFullList<PbRecord>({ sort: 'name' })
  return records.map(pbOverheadToApp)
}

export async function getOverheadExpense(id: string): Promise<OverheadExpense | null> {
  try {
    const record = await pb().collection('overhead_expenses').getOne<PbRecord>(id)
    return pbOverheadToApp(record)
  } catch {
    return null
  }
}

export async function createOverheadExpense(input: OverheadInput): Promise<OverheadExpense> {
  const record = await pb().collection('overhead_expenses').create<PbRecord>(
    withOrganization(appOverheadToPb(input)),
  )
  return pbOverheadToApp(record)
}

export async function updateOverheadExpense(
  id: string,
  input: Partial<OverheadInput>
): Promise<OverheadExpense | null> {
  try {
    const current = await getOverheadExpense(id)
    if (!current) return null
    const merged = { ...current, ...input }
    const record = await pb().collection('overhead_expenses').update<PbRecord>(id, appOverheadToPb(merged))
    return pbOverheadToApp(record)
  } catch {
    return null
  }
}

export async function deleteOverheadExpense(id: string): Promise<boolean> {
  try {
    await pb().collection('overhead_expenses').delete(id)
    return true
  } catch {
    return false
  }
}

export async function getMonthlyOverheadTotal(): Promise<number> {
  const expenses = await getOverheadExpenses()
  return expenses
    .filter((e) => (e.billing_cycle ?? 'monthly') === 'monthly')
    .reduce((s, e) => s + e.amount, 0)
}

export async function getOverheadForRange(range: DateRangeKey): Promise<number> {
  const expenses = await getOverheadExpenses()
  return overheadAmountForRange(expenses, range)
}
