/** Minimal `@rinse/core` types needed for Desk Money P&L (kept in sync with Detailing packages/core). */

export type LocationType = 'mobile' | 'fixed'
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'van' | 'boat' | 'other'
export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'invoiced' | 'paid' | 'cancelled'
export type BillingCycle = 'monthly' | 'annual' | 'one_time'
export type OverheadCategory = 'vehicle' | 'insurance' | 'equipment' | 'software' | 'marketing' | 'other'
export type DepositStatus = 'none' | 'due' | 'paid' | 'waived'

export type BusinessExpenseCategory =
  | 'legal'
  | 'licensing'
  | 'taxes'
  | 'insurance'
  | 'vehicle'
  | 'marketing'
  | 'software'
  | 'equipment'
  | 'supplies'
  | 'other'

export interface ExpenseLine {
  category: 'supplies' | 'travel' | 'equipment' | 'marketing' | 'labor' | 'other'
  description: string
  amount: number
}

export interface SupplyUsage {
  supply_id: string
  quantity_used: number
}

export interface OverheadExpense {
  id: string
  name: string
  amount: number
  category?: OverheadCategory
  billing_cycle?: BillingCycle
  next_due?: string
  notes?: string
}

export interface BusinessExpense {
  id: string
  date: string
  name: string
  amount: number
  category?: BusinessExpenseCategory
  vendor?: string
  notes?: string
  receipt_url?: string
}

export interface Job {
  id: string
  date: string
  start_time?: string
  hours_worked: number
  location_type: LocationType
  package_id: string
  vehicle_type: VehicleType
  client_id: string
  status: JobStatus
  revenue: number
  tip: number
  expenses: ExpenseLine[]
  supplies_used: SupplyUsage[]
  travel_cost: number
  marketing_cost: number
  equipment_depreciation: number
  notes?: string
  photo_count: number
  invoice_id?: string
  deposit_status?: DepositStatus
  deposit_amount?: number
  route_order?: number
  created?: string
  updated?: string
}
