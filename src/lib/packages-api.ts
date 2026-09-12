import type { OverheadExpense, OverheadInput, Package, PackageInput } from '@rinse/core'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { formatPocketBaseError } from './pocketbase-errors'
import { requireOrganizationId } from './org'
import { requireOrganizationIdForWrite } from './org-write'

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function mapPackage(record: Record<string, unknown>): Package {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    base_price: Number(record.base_price ?? 0),
    description: record.description ? String(record.description) : undefined,
    expected_return_days: Number(record.expected_return_days ?? 30),
    duration_minutes: Number(record.duration_minutes ?? 60),
    default_supplies: Array.isArray(record.default_supplies)
      ? (record.default_supplies as Package['default_supplies'])
      : undefined,
    active: Boolean(record.active ?? true),
  }
}

export async function listAllPackages(): Promise<Package[]> {
  if (!(await isOnline())) return []
  const orgId = requireOrganizationId()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb().collection('packages').getFullList({
    filter: `organization_id = "${escaped}"`,
    sort: 'name',
  })
  return records.map((r) => mapPackage(r as Record<string, unknown>))
}

function toPackagePayload(input: PackageInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    base_price: input.base_price,
    active: input.active ?? true,
  }
  if (input.description !== undefined) payload.description = input.description
  if (input.expected_return_days !== undefined) payload.expected_return_days = input.expected_return_days
  if (input.duration_minutes !== undefined) payload.duration_minutes = input.duration_minutes
  if (input.default_supplies?.length) payload.default_supplies = input.default_supplies
  return payload
}

function toPackagePatch(input: Partial<PackageInput>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (input.name !== undefined) payload.name = input.name.trim()
  if (input.base_price !== undefined) payload.base_price = input.base_price
  if (input.description !== undefined) payload.description = input.description
  if (input.expected_return_days !== undefined) payload.expected_return_days = input.expected_return_days
  if (input.duration_minutes !== undefined) payload.duration_minutes = input.duration_minutes
  if (input.default_supplies !== undefined) payload.default_supplies = input.default_supplies
  if (input.active !== undefined) payload.active = input.active
  return payload
}

export async function createPackage(input: PackageInput): Promise<Package> {
  const orgId = await requireOrganizationIdForWrite()
  try {
    const record = await pb().collection('packages').create({
      organization_id: orgId,
      ...toPackagePayload(input),
    })
    return mapPackage(record as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPocketBaseError(err, 'Could not create package'))
  }
}

export async function updatePackage(id: string, input: Partial<PackageInput>): Promise<Package | null> {
  await requireOrganizationIdForWrite()
  try {
    const record = await pb().collection('packages').update(id, toPackagePatch(input))
    return mapPackage(record as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function deletePackage(id: string): Promise<boolean> {
  await requireOrganizationIdForWrite()
  try {
    await pb().collection('packages').update(id, { active: false })
    return true
  } catch {
    return false
  }
}

function mapOverhead(record: Record<string, unknown>): OverheadExpense {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    amount: Number(record.amount ?? 0),
    category: record.category as OverheadExpense['category'],
    billing_cycle: record.billing_cycle as OverheadExpense['billing_cycle'],
    next_due: record.next_due ? String(record.next_due) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
  }
}

export async function listOverheadExpenses(): Promise<OverheadExpense[]> {
  if (!(await isOnline())) return []
  const orgId = requireOrganizationId()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb().collection('overhead_expenses').getFullList({
    filter: `organization_id = "${escaped}"`,
    sort: 'name',
  })
  return records.map((r) => mapOverhead(r as Record<string, unknown>))
}

export async function createOverheadExpense(input: OverheadInput): Promise<OverheadExpense> {
  const orgId = await requireOrganizationIdForWrite()
  try {
    const record = await pb().collection('overhead_expenses').create({
      organization_id: orgId,
      name: input.name,
      amount: input.amount,
      category: input.category ?? 'other',
      billing_cycle: input.billing_cycle ?? 'monthly',
      next_due: input.next_due ?? '',
      notes: input.notes ?? '',
    })
    return mapOverhead(record as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPocketBaseError(err, 'Could not create expense'))
  }
}

export async function updateOverheadExpense(
  id: string,
  input: Partial<OverheadInput>
): Promise<OverheadExpense | null> {
  try {
    const record = await pb().collection('overhead_expenses').update(id, input)
    return mapOverhead(record as Record<string, unknown>)
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
  const expenses = await listOverheadExpenses()
  return expenses
    .filter((e) => (e.billing_cycle ?? 'monthly') === 'monthly')
    .reduce((sum, e) => sum + e.amount, 0)
}
