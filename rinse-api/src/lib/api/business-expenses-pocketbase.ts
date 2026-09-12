import { businessExpensesTotalForDates } from '../business-expenses-logic'
import { getPocketBase } from '../pocketbase'
import { appBusinessExpenseToPb, pbBusinessExpenseToApp, type PbRecord } from './mappers'
import { withOrganization } from './tenant-pocketbase'
import type { BusinessExpense, BusinessExpenseInput } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

export async function getBusinessExpenses(): Promise<BusinessExpense[]> {
  const records = await pb().collection('business_expenses').getFullList<PbRecord>({ sort: '-date' })
  return records.map(pbBusinessExpenseToApp)
}

export async function getBusinessExpense(id: string): Promise<BusinessExpense | null> {
  try {
    const record = await pb().collection('business_expenses').getOne<PbRecord>(id)
    return pbBusinessExpenseToApp(record)
  } catch {
    return null
  }
}

export async function createBusinessExpense(input: BusinessExpenseInput): Promise<BusinessExpense> {
  const record = await pb().collection('business_expenses').create<PbRecord>(
    withOrganization(appBusinessExpenseToPb(input)),
  )
  return pbBusinessExpenseToApp(record)
}

export async function updateBusinessExpense(
  id: string,
  input: Partial<BusinessExpenseInput>
): Promise<BusinessExpense | null> {
  try {
    const current = await getBusinessExpense(id)
    if (!current) return null
    const merged = { ...current, ...input }
    const record = await pb().collection('business_expenses').update<PbRecord>(id, appBusinessExpenseToPb(merged))
    return pbBusinessExpenseToApp(record)
  } catch {
    return null
  }
}

export async function deleteBusinessExpense(id: string): Promise<boolean> {
  try {
    await pb().collection('business_expenses').delete(id)
    return true
  } catch {
    return false
  }
}

export async function getBusinessExpensesTotalForDates(start: Date, end: Date): Promise<number> {
  const expenses = await getBusinessExpenses()
  return businessExpensesTotalForDates(expenses, start, end)
}
