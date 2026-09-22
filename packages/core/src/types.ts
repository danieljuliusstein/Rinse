export type LocationType = 'mobile' | 'fixed'
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'van' | 'boat' | 'other'
export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'invoiced' | 'paid' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'

export type LeadStage = 'inquiry' | 'quoted' | 'booked'

export type LeadSource =
  | 'instagram'
  | 'google'
  | 'referral'
  | 'facebook'
  | 'tiktok'
  | 'word_of_mouth'
  | 'website'
  | 'text'
  | 'other'
export type PhotoType = 'before' | 'after'
export type OverheadCategory = 'vehicle' | 'insurance' | 'equipment' | 'software' | 'marketing' | 'other'
export type BillingCycle = 'monthly' | 'annual' | 'one_time'
export type RecurrenceCadence = 'weekly' | 'biweekly' | 'monthly'

export type DepositStatus = 'none' | 'due' | 'paid' | 'waived'

export type BusinessPolicies = {
  deposit_mode: 'percent' | 'fixed'
  deposit_value: number
  collect_at_booking: boolean
  cancel_window_hours: number
  no_show_fee: number
  no_show_fee_copy: string
}

export type TipPrefs = {
  suggest_on_pay_link: boolean
  presets: number[]
  tips_go_to: string
}

export type PortalPermissions = {
  pay: boolean
  photos: boolean
  reschedule: boolean
}

export type TaxPreset = { name: string; rate: number }
export type SopTemplate = { id: string; name: string; items: string[] }
export type TechRosterEntry = { id: string; name: string; color: string }
export type ChecklistItem = { id: string; label: string; done: boolean }
export type ReviewPrefs = {
  review_link: string
  review_rating_avg: number
  review_count: number
}

export interface ExpenseLine {
  category: 'supplies' | 'travel' | 'equipment' | 'marketing' | 'labor' | 'other'
  description: string
  amount: number
}

export interface SupplyUsage {
  supply_id: string
  quantity_used: number
}

export interface Payment {
  id?: string
  amount: number
  method: string
  date: string
  note?: string
}

export interface Package {
  id: string
  name: string
  base_price: number
  description?: string
  /** Typical days until this service type should be booked again. */
  expected_return_days: number
  /** Minutes blocked on the calendar when clients book online. */
  duration_minutes: number
  default_supplies?: { supply_id: string; default_qty: number }[]
  active: boolean
  deposit_amount?: number
}

export type SupplyKind = 'chemical' | 'consumable' | 'other'
export type EquipmentStatus = 'active' | 'retired'

export interface Supply {
  id: string
  name: string
  unit: string
  quantity_on_hand: number
  reorder_threshold?: number
  cost_per_unit?: number
  supplier?: string
  kind?: SupplyKind
  notes?: string
  image_url?: string
  icon_key?: string
}

export interface Equipment {
  id: string
  name: string
  purchase_price?: number
  purchase_date?: string
  supplier?: string
  notes?: string
  status?: EquipmentStatus
  image_url?: string
  icon_key?: string
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

export interface BusinessExpense {
  id: string
  date: string
  name: string
  amount: number
  category?: BusinessExpenseCategory
  vendor?: string
  notes?: string
  /** Public/auth URL for the linked receipt image when uploaded. */
  receipt_url?: string
  supply_id?: string
  equipment_id?: string
  quantity?: number
  snapshot_qty_on_hand?: number
  snapshot_cost_per_unit?: number
}

export interface BusinessExpenseInput {
  date: string
  name: string
  amount: number
  category?: BusinessExpenseCategory
  vendor?: string
  notes?: string
  supply_id?: string
  equipment_id?: string
  quantity?: number
  snapshot_qty_on_hand?: number
  snapshot_cost_per_unit?: number
}

export interface SupplyPurchaseInput {
  date: string
  name: string
  amount: number
  quantity: number
  vendor?: string
  notes?: string
  supply_id?: string
  new_supply?: SupplyInput
}

export interface PhotoMeta {
  filename: string
  type: PhotoType
}

export interface JobPhoto {
  filename: string
  url: string
  type: PhotoType
}

export interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  /** Cached geocode from address (PocketBase clients.lat/lng). */
  lat?: number
  lng?: number
  lead_source?: string
  tags?: string[]
  notes?: string
  /** Dealer / fleet parent — sub-customers nest under this client. */
  parent_client_id?: string
  membership_cadence?: RecurrenceCadence
  membership_paused?: boolean
  membership_next_visit?: string
  created?: string
}

export interface Vehicle {
  id: string
  client_id: string
  year?: number
  make: string
  model: string
  color?: string
  color_hex?: string
  vin?: string
  plate?: string
  type: VehicleType
  photo_url?: string
  created?: string
}

export interface VehicleInput {
  client_id: string
  year?: number
  make: string
  model: string
  color?: string
  color_hex?: string
  vin?: string
  plate?: string
  type: VehicleType
  photo_url?: string
}

export interface DamageRecord {
  id: string
  vehicle_id: string
  area: string
  note: string
  date: string
  /** Device-reported capture time (informational). Prefer uploaded_at for liability. */
  captured_at: string
  /** Server-assigned upload time — source of truth for liability docs. */
  uploaded_at?: string
  photo_url: string | null
  linked_job_id?: string
}

export interface DamageRecordInput {
  vehicle_id: string
  area: string
  note: string
  date: string
  captured_at: string
  photo_url?: string | null
  linked_job_id?: string
}

export interface Job {
  id: string
  date: string
  start_time?: string
  /** End of customer-facing arrival window (HH:mm). */
  arrival_window_end?: string
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
  photo_meta?: PhotoMeta[]
  invoice_id?: string
  recurrence_cadence?: RecurrenceCadence
  recurrence_anchor_date?: string
  /** Server-stamped when pre-job liability walkthrough is finished. */
  inspection_completed_at?: string
  /** Vehicle used for the pre-job walkthrough. */
  inspection_vehicle_id?: string
  deposit_status?: DepositStatus
  deposit_amount?: number
  deposit_paid_at?: string
  route_order?: number
  assignee_id?: string
  weather_hold?: boolean
  checklist_items?: ChecklistItem[]
  extra_line_items?: InvoiceLineTemplate[]
  created?: string
  updated?: string
}

export interface Quote {
  id: string
  quote_number: string
  client_id: string
  package_id: string
  vehicle_type: VehicleType
  location_type: LocationType
  date: string
  /** Package + Σ(extra line qty × unit_price). */
  subtotal: number
  extra_line_items?: InvoiceLineTemplate[]
  notes?: string
  status: QuoteStatus
  valid_until?: string
  job_id?: string
  sent_at?: string
  created?: string
}

export interface QuoteWithRelations extends Quote {
  client?: Client
  package?: Package
}

export interface QuoteInput {
  client_id: string
  package_id: string
  vehicle_type: VehicleType
  location_type: LocationType
  date: string
  subtotal: number
  extra_line_items?: InvoiceLineTemplate[]
  notes?: string
  valid_until?: string
}

export interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  source: LeadSource
  vehicle_type: VehicleType
  package_id?: string
  service_interest?: string
  quote_amount?: number
  stage: LeadStage
  client_id?: string
  quote_id?: string
  job_id?: string
  notes?: string
  created?: string
}

export interface LeadWithRelations extends Lead {
  package?: Package
  quote?: Quote
  client?: Client
}

export interface LeadInput {
  name: string
  phone?: string
  email?: string
  source: LeadSource
  vehicle_type: VehicleType
  package_id?: string
  service_interest?: string
  quote_amount?: number
  stage?: LeadStage
  client_id?: string
  quote_id?: string
  job_id?: string
  notes?: string
}

export interface Invoice {
  id: string
  invoice_number: string
  job_id: string
  client_id: string
  subtotal: number
  tip: number
  total: number
  status: InvoiceStatus
  payments: Payment[]
  amount_paid: number
  balance_due: number
  sent_at?: string
  paid_at?: string
  terms?: string
  notes?: string
  discount_amount?: number
  tax_rate?: number
  tax_amount?: number
  /** Display label for the tax jurisdiction (rate still on tax_rate). */
  tax_jurisdiction?: string
  po_number?: string
  signature_url?: string
  signed_at?: string
  extra_line_items?: InvoiceLineTemplate[]
}

/** Billing unit for hybrid invoice / quote lines. */
export type InvoiceLineUnit = 'each' | 'hour' | 'flat'

/**
 * Template library row and invoice/quote extra line.
 * Prefer quantity × unit_price; default_amount is kept in sync for legacy readers.
 */
export interface InvoiceLineTemplate {
  id: string
  description: string
  /** Line total — always quantity × unit_price when hybrid fields are set. */
  default_amount: number
  quantity?: number
  unit_price?: number
  unit?: InvoiceLineUnit
  category?: string
  active?: boolean
}

export interface JobWithRelations extends Job {
  client?: Client
  package?: Package
  invoice?: Invoice
}

export interface QuickJobData {
  clientId: string | null
  clientName: string
  packageId: string
  vehicleType: VehicleType
  locationType: LocationType
  revenue: number
  tip: number
  date: string
  start_time?: string
  notes?: string
  travel_cost?: number
  marketing_cost?: number
  equipment_depreciation?: number
  supplies_used?: SupplyUsage[]
  recurrence_cadence?: RecurrenceCadence
  recurrence_anchor_date?: string
}

export interface DashboardKpis {
  revenueMtd: number
  expensesMtd: number
  profitMtd: number
  marginMtd: number
  outstanding: number
  outstandingInvoiceCount: number
  revenueToday: number
  jobsThisWeek: number
}

export interface DashboardData {
  kpis: DashboardKpis
  recentJobs: RecentJobRow[]
  jobsToday: number
  priorRevenueMtd: number
  insights: string[]
}

export interface RecentJobRow {
  id: string
  clientName: string
  package: string
  packageId?: string
  vehicleType: string
  locationType: LocationType
  revenue: number
  profit: number
  status: 'paid' | 'invoiced' | 'scheduled' | 'completed' | 'overdue' | 'in_progress' | 'cancelled'
  scheduledDate?: string
  startTime?: string
  clientAddress?: string
  jobStatus?: JobStatus
}

export interface JobEditData {
  date: string
  packageId: string
  vehicleType: VehicleType
  locationType: LocationType
  revenue: number
  tip: number
  hours_worked: number
  start_time?: string
  status: JobStatus
  notes?: string
  supplies_used?: SupplyUsage[]
  travel_cost?: number
  marketing_cost?: number
  equipment_depreciation?: number
  recurrence_cadence?: RecurrenceCadence
  recurrence_anchor_date?: string
  /** Client sends a truthy sentinel; PocketBase hook overwrites with server time. */
  inspection_completed_at?: string
  inspection_vehicle_id?: string
  deposit_status?: DepositStatus
  deposit_amount?: number
  deposit_paid_at?: string
  route_order?: number
  assignee_id?: string
  weather_hold?: boolean
  checklist_items?: ChecklistItem[]
  extra_line_items?: InvoiceLineTemplate[]
}

export interface SupplyInput {
  name: string
  unit: string
  quantity_on_hand: number
  reorder_threshold?: number
  cost_per_unit?: number
  supplier?: string
  kind?: SupplyKind
  notes?: string
  image_url?: string
  icon_key?: string
}

export interface SupplyAddOptions {
  logExpense?: boolean
  totalPaid?: number
  purchaseDate?: string
}

export interface RestockInput {
  quantity: number
  total_cost?: number
}

export interface EquipmentInput {
  name: string
  purchase_price?: number
  purchase_date?: string
  supplier?: string
  notes?: string
  status?: EquipmentStatus
  image_url?: string
  icon_key?: string
}

export interface EquipmentAddOptions {
  logExpense?: boolean
  purchaseDate?: string
}

export interface OverheadInput {
  name: string
  amount: number
  category?: OverheadCategory
  billing_cycle?: BillingCycle
  next_due?: string
  notes?: string
}

export interface ClientInput {
  name: string
  phone?: string
  email?: string
  address?: string
  lead_source?: string
  tags?: string[]
  notes?: string
  parent_client_id?: string
  membership_cadence?: RecurrenceCadence
  membership_paused?: boolean
  membership_next_visit?: string
}

export interface PackageInput {
  name: string
  base_price: number
  description?: string
  expected_return_days?: number
  duration_minutes?: number
  default_supplies?: { supply_id: string; default_qty: number }[]
  active?: boolean
  deposit_amount?: number
}

export interface TimeBlock {
  id: string
  date: string
  start_time?: string
  end_time?: string
  all_day: boolean
  label?: string
}

export interface TimeBlockInput {
  date: string
  start_time?: string
  end_time?: string
  all_day?: boolean
  label?: string
}

export interface ClientWithStats extends Client {
  totalRevenue: number
  jobCount: number
  lastJobDate?: string | null
  firstJobDate?: string | null
  lastServiceName?: string | null
  /** Cadence from the client's most recent job package. */
  expectedReturnDays: number
}

export interface WeekDay {
  date: string
  label: string
  dayNum: number
  isToday: boolean
  jobCount: number
  blocked?: boolean
}
