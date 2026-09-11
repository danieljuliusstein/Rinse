import type { BusinessExpense, ExpenseLine, Job, LocationType, VehicleType } from '@/lib/rinse-core'
import type { DeskExpense, DeskJob } from '@/lib/types'

const EXPENSE_CATEGORIES = new Set<ExpenseLine['category']>([
  'supplies',
  'travel',
  'equipment',
  'marketing',
  'labor',
  'other',
])

const VEHICLE_TYPES = new Set<VehicleType>(['sedan', 'suv', 'truck', 'van', 'boat', 'other'])

function asExpenseCategory(raw?: string): ExpenseLine['category'] {
  if (raw && EXPENSE_CATEGORIES.has(raw as ExpenseLine['category'])) {
    return raw as ExpenseLine['category']
  }
  return 'other'
}

function asVehicleType(raw?: string): VehicleType {
  if (raw && VEHICLE_TYPES.has(raw as VehicleType)) return raw as VehicleType
  return 'other'
}

function asLocationType(raw?: string): LocationType {
  return raw === 'fixed' ? 'fixed' : 'mobile'
}

/** Map Desk job rows to `@rinse/core` Job for shared P&L math. */
export function toCoreJob(job: DeskJob): Job {
  return {
    id: job.id,
    date: job.date,
    start_time: job.start_time,
    hours_worked: job.hours_worked ?? 1,
    location_type: asLocationType(job.location_type),
    package_id: job.package_id || 'unknown',
    vehicle_type: asVehicleType(job.vehicle_type),
    client_id: job.client_id || '',
    status: job.status,
    revenue: Number(job.revenue ?? 0),
    tip: Number(job.tip ?? 0),
    expenses: (job.expenses ?? []).map((e) => ({
      category: asExpenseCategory(e.category),
      description: e.description ?? '',
      amount: Number(e.amount ?? 0),
    })),
    supplies_used: [],
    travel_cost: Number(job.travel_cost ?? 0),
    marketing_cost: Number(job.marketing_cost ?? 0),
    equipment_depreciation: Number(job.equipment_depreciation ?? 0),
    notes: job.notes,
    photo_count: 0,
    invoice_id: job.invoice_id,
    route_order: job.route_order,
    deposit_status: job.deposit_status,
    deposit_amount: job.deposit_amount,
    created: job.created,
    updated: job.updated,
  }
}

export function toCoreJobs(jobs: DeskJob[]): Job[] {
  return jobs.map(toCoreJob)
}

export function toCoreBusinessExpense(expense: DeskExpense): BusinessExpense {
  return {
    id: expense.id,
    date: expense.date,
    name: expense.name,
    amount: expense.amount,
    category: expense.category as BusinessExpense['category'],
    vendor: expense.vendor,
    receipt_url: expense.receipt_url,
  }
}

export function toCoreBusinessExpenses(expenses: DeskExpense[]): BusinessExpense[] {
  return expenses.map(toCoreBusinessExpense)
}
