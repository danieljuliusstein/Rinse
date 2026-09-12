import * as businessExpensesLocal from './business-expenses-local'
import * as businessExpensesPb from './business-expenses-pocketbase'
import type { BusinessExpense } from '../types'

/** PocketBase records plus any local-only rows (e.g. queued offline writes). */
export async function getBusinessExpensesMerged(): Promise<BusinessExpense[]> {
  const local = businessExpensesLocal.getBusinessExpenses()
  try {
    const remote = await businessExpensesPb.getBusinessExpenses()
    const remoteIds = new Set(remote.map((e) => e.id))
    const pending = local.filter((e) => !remoteIds.has(e.id))
    return [...remote, ...pending]
  } catch {
    return local
  }
}
