import { isDemoAppData } from './demo-data'
import { DEMO_CLIENT_ADDRESSES } from './demo-schedule'
import { isPocketBaseConfigured } from './pocketbase'
import { scopedStorageKey } from './tenant'
import type { BusinessExpense, Client, DamageRecord, Equipment, Invoice, Job, Lead, OverheadExpense, Package, Quote, Supply, Vehicle } from './types'

function useDevDemoSeed(): boolean {
  return process.env.NODE_ENV === 'development' && !isPocketBaseConfigured()
}

const STORAGE_KEY = 'detailing_app_data_v1'

export interface JobPhotoLocal {
  id: string
  data_url: string
  type: 'before' | 'after'
}

export interface AppData {
  packages: Package[]
  clients: Client[]
  jobs: Job[]
  invoices: Invoice[]
  quotes?: Quote[]
  leads?: Lead[]
  supplies: Supply[]
  equipment?: Equipment[]
  overhead_expenses: OverheadExpense[]
  business_expenses?: BusinessExpense[]
  job_photos: Record<string, JobPhotoLocal[]>
  vehicles?: Vehicle[]
  damage_docs?: DamageRecord[]
}

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function createSeedData(): AppData {
  const packages: Package[] = [
    { id: 'pkg_basic', name: 'Basic Wash', base_price: 80, expected_return_days: 30, duration_minutes: 90, active: true, description: 'Exterior wash and dry', default_supplies: [{ supply_id: 'sup_soap', default_qty: 4 }, { supply_id: 'sup_towel', default_qty: 2 }] },
    { id: 'pkg_full', name: 'Full Detail', base_price: 320, expected_return_days: 90, duration_minutes: 240, active: true, description: 'Interior + exterior full detail', default_supplies: [{ supply_id: 'sup_soap', default_qty: 8 }, { supply_id: 'sup_interior', default_qty: 6 }, { supply_id: 'sup_towel', default_qty: 4 }] },
    { id: 'pkg_paint', name: 'Paint Correct', base_price: 450, expected_return_days: 180, duration_minutes: 300, active: true, description: 'Single-stage paint correction', default_supplies: [{ supply_id: 'sup_soap', default_qty: 6 }, { supply_id: 'sup_wax', default_qty: 4 }, { supply_id: 'sup_towel', default_qty: 6 }] },
    { id: 'pkg_ceramic', name: 'Ceramic Coat', base_price: 800, expected_return_days: 365, duration_minutes: 360, active: true, description: 'Ceramic coating application', default_supplies: [{ supply_id: 'sup_ceramic', default_qty: 8 }, { supply_id: 'sup_towel', default_qty: 4 }] },
  ]

  const supplies: Supply[] = [
    { id: 'sup_soap', name: 'Car wash soap', unit: 'oz', quantity_on_hand: 128, reorder_threshold: 32, cost_per_unit: 0.15, supplier: 'Chemical Guys', kind: 'chemical' },
    { id: 'sup_towel', name: 'Microfiber towels', unit: 'each', quantity_on_hand: 24, reorder_threshold: 8, cost_per_unit: 2.5, supplier: 'Amazon', kind: 'consumable' },
    { id: 'sup_interior', name: 'Interior cleaner', unit: 'oz', quantity_on_hand: 64, reorder_threshold: 16, cost_per_unit: 0.22, supplier: 'Meguiars', kind: 'chemical' },
    { id: 'sup_wax', name: 'Wax / sealant', unit: 'oz', quantity_on_hand: 32, reorder_threshold: 8, cost_per_unit: 1.2, supplier: 'Chemical Guys', kind: 'chemical' },
    { id: 'sup_ceramic', name: 'Ceramic coating', unit: 'oz', quantity_on_hand: 16, reorder_threshold: 4, cost_per_unit: 8.5, supplier: 'Gtechniq', kind: 'chemical' },
  ]

  const equipment: Equipment[] = [
    { id: 'eq_polisher', name: 'DA polisher', purchase_price: 350, status: 'active' },
    { id: 'eq_vacuum', name: 'Vacuum', purchase_price: 180, status: 'active' },
    { id: 'eq_pressure', name: 'Pressure washer', purchase_price: 420, status: 'active' },
  ]

  const overhead_expenses: OverheadExpense[] = [
    { id: 'oh_van', name: 'Van payment', amount: 450, category: 'vehicle', billing_cycle: 'monthly' },
    { id: 'oh_ins', name: 'Business insurance', amount: 120, category: 'insurance', billing_cycle: 'monthly' },
    { id: 'oh_soft', name: 'Scheduling software', amount: 29, category: 'software', billing_cycle: 'monthly' },
    { id: 'oh_polish', name: 'Polisher replacement', amount: 350, category: 'equipment', billing_cycle: 'one_time', next_due: '2026-09-01' },
  ]

  const clients: Client[] = [
    {
      id: 'cli_marcus',
      name: 'Marcus Thompson',
      phone: '(555) 234-8901',
      email: 'marcus.t@email.com',
      address: DEMO_CLIENT_ADDRESSES.cli_marcus,
      lead_source: 'referral',
      tags: ['repeat', 'vip'],
      created: '2026-03-01T10:00:00Z',
    },
    {
      id: 'cli_sarah',
      name: 'Sarah K.',
      phone: '(555) 876-5432',
      email: 'sarah.k@email.com',
      address: DEMO_CLIENT_ADDRESSES.cli_sarah,
      lead_source: 'google',
      created: '2026-04-15T10:00:00Z',
    },
    {
      id: 'cli_james',
      name: 'James R.',
      phone: '(555) 111-2233',
      address: DEMO_CLIENT_ADDRESSES.cli_james,
      lead_source: 'instagram',
      created: '2026-05-01T10:00:00Z',
    },
  ]

  const today = new Date()
  const fmtDate = (d: Date) => d.toISOString().split('T')[0]

  const jobs: Job[] = [
    {
      id: 'job_001',
      date: fmtDate(today),
      start_time: '09:00',
      hours_worked: 0,
      location_type: 'mobile',
      package_id: 'pkg_full',
      vehicle_type: 'truck',
      client_id: 'cli_marcus',
      status: 'in_progress',
      revenue: 320,
      tip: 0,
      expenses: [],
      supplies_used: [],
      travel_cost: 18.76,
      marketing_cost: 0,
      equipment_depreciation: 0,
      photo_count: 2,
    },
    {
      id: 'job_005',
      date: fmtDate(today),
      start_time: '10:00',
      hours_worked: 0,
      location_type: 'mobile',
      package_id: 'pkg_full',
      vehicle_type: 'suv',
      client_id: 'cli_sarah',
      status: 'scheduled',
      revenue: 320,
      tip: 0,
      expenses: [],
      supplies_used: [],
      travel_cost: 0,
      marketing_cost: 0,
      equipment_depreciation: 0,
      photo_count: 0,
      notes: 'Demo — blocks 10:00 and 12:00 booking slots (4h service)',
    },
    {
      id: 'job_002',
      date: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
      hours_worked: 2,
      location_type: 'fixed',
      package_id: 'pkg_basic',
      vehicle_type: 'sedan',
      client_id: 'cli_sarah',
      status: 'invoiced',
      revenue: 80,
      tip: 0,
      expenses: [],
      supplies_used: [],
      travel_cost: 0,
      marketing_cost: 0,
      equipment_depreciation: 0,
      photo_count: 0,
      invoice_id: 'inv_002',
    },
    {
      id: 'job_003',
      date: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
      start_time: '10:00',
      hours_worked: 0,
      location_type: 'mobile',
      package_id: 'pkg_paint',
      vehicle_type: 'suv',
      client_id: 'cli_james',
      status: 'scheduled',
      revenue: 450,
      tip: 0,
      expenses: [],
      supplies_used: [],
      travel_cost: 0,
      marketing_cost: 0,
      equipment_depreciation: 0,
      photo_count: 0,
    },
    {
      id: 'job_004',
      date: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5)),
      hours_worked: 4,
      location_type: 'mobile',
      package_id: 'pkg_ceramic',
      vehicle_type: 'sedan',
      client_id: 'cli_marcus',
      status: 'completed',
      revenue: 800,
      tip: 50,
      expenses: [{ category: 'supplies', description: 'Ceramic supplies', amount: 120 }],
      supplies_used: [{ supply_id: 'sup_ceramic', quantity_used: 8 }],
      travel_cost: 15,
      marketing_cost: 0,
      equipment_depreciation: 0,
      photo_count: 4,
    },
  ]

  const invoices: Invoice[] = [
    {
      id: 'inv_001',
      invoice_number: 'DET-2026-06-031',
      job_id: 'job_004',
      client_id: 'cli_marcus',
      subtotal: 800,
      tip: 50,
      total: 850,
      status: 'paid',
      payments: [{ amount: 850, method: 'Venmo', date: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5)) }],
      amount_paid: 850,
      balance_due: 0,
      paid_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
      terms: 'Due on receipt',
    },
    {
      id: 'inv_002',
      invoice_number: 'DET-2026-06-028',
      job_id: 'job_002',
      client_id: 'cli_sarah',
      subtotal: 80,
      tip: 0,
      total: 80,
      status: 'sent',
      payments: [],
      amount_paid: 0,
      balance_due: 80,
      sent_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString(),
      terms: 'Due on receipt',
    },
  ]

  const vehicles: Vehicle[] = [
    {
      id: 'veh_marcus_truck',
      client_id: 'cli_marcus',
      year: 2019,
      make: 'Ford',
      model: 'F-150',
      color: 'Oxford White',
      color_hex: '#e8e8e8',
      plate: 'GA-4821',
      type: 'truck',
    },
    {
      id: 'veh_sarah_tesla',
      client_id: 'cli_sarah',
      year: 2022,
      make: 'Tesla',
      model: 'Model 3',
      color: 'Midnight Blue',
      color_hex: '#1a3a6a',
      plate: 'DX91AB',
      type: 'sedan',
    },
  ]

  const damage_docs: DamageRecord[] = [
    {
      id: 'dmg_001',
      vehicle_id: 'veh_sarah_tesla',
      area: 'Front bumper',
      note: 'Small paint chip, pre-existing — noted by client at intake',
      date: '2026-06-02',
      captured_at: '2026-06-02T09:14:00.000Z',
      photo_url: null,
    },
    {
      id: 'dmg_002',
      vehicle_id: 'veh_sarah_tesla',
      area: 'Driver door',
      note: 'Light surface scratch, approx 4 inches, clear coat only',
      date: '2026-05-15',
      captured_at: '2026-05-15T14:30:00.000Z',
      photo_url: null,
    },
    {
      id: 'dmg_003',
      vehicle_id: 'veh_sarah_tesla',
      area: 'Rear quarter panel',
      note: 'Hail pitting, minor. Pre-existing per client.',
      date: '2026-02-14',
      captured_at: '2026-02-14T11:05:00.000Z',
      photo_url: null,
    },
    {
      id: 'dmg_004',
      vehicle_id: 'veh_marcus_truck',
      area: 'Tailgate',
      note: 'Scuff marks from loading equipment — documented at intake',
      date: '2026-05-28',
      captured_at: '2026-05-28T08:45:00.000Z',
      photo_url: null,
    },
  ]

  const leads: Lead[] = [
    {
      id: 'lead_001',
      name: 'Alex M.',
      phone: '(555) 444-7788',
      email: 'alex@email.com',
      source: 'instagram',
      vehicle_type: 'suv',
      package_id: 'pkg_full',
      service_interest: 'Full detail',
      quote_amount: 320,
      stage: 'inquiry',
      created: '2026-06-01T10:00:00Z',
    },
    {
      id: 'lead_002',
      name: 'Taylor R.',
      phone: '(555) 222-9911',
      source: 'google',
      vehicle_type: 'sedan',
      package_id: 'pkg_paint',
      stage: 'quoted',
      client_id: 'cli_sarah',
      created: '2026-06-03T10:00:00Z',
    },
  ]

  return { packages, clients, jobs, invoices, quotes: [], leads, supplies, equipment, overhead_expenses, business_expenses: [], job_photos: {}, vehicles, damage_docs }
}

/** Empty store — used when PocketBase is configured so we never show demo seed data on fallback. */
export function createEmptyData(): AppData {
  return {
    packages: [],
    clients: [],
    jobs: [],
    invoices: [],
    quotes: [],
    leads: [],
    supplies: [],
    equipment: [],
    overhead_expenses: [],
    business_expenses: [],
    job_photos: {},
    vehicles: [],
    damage_docs: [],
  }
}

function defaultLocalData(): AppData {
  return useDevDemoSeed() ? createSeedData() : createEmptyData()
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return createSeedData()

  const raw = localStorage.getItem(scopedStorageKey(STORAGE_KEY))
  if (!raw || !raw.trim()) {
    const initial = defaultLocalData()
    if (useDevDemoSeed()) {
      saveData(initial)
    }
    return initial
  }

  let parsed: Partial<AppData>
  try {
    parsed = JSON.parse(raw) as Partial<AppData>
  } catch {
    const initial = defaultLocalData()
    saveData(initial)
    return initial
  }
  const fallback = defaultLocalData()
  const merged: AppData = {
    packages: parsed.packages ?? fallback.packages,
    clients: parsed.clients ?? fallback.clients,
    jobs: parsed.jobs ?? fallback.jobs,
    invoices: parsed.invoices ?? fallback.invoices,
    quotes: parsed.quotes ?? fallback.quotes ?? [],
    leads: parsed.leads ?? fallback.leads ?? [],
    supplies: parsed.supplies ?? fallback.supplies,
    equipment: parsed.equipment ?? fallback.equipment ?? [],
    overhead_expenses: parsed.overhead_expenses ?? fallback.overhead_expenses,
    business_expenses: parsed.business_expenses ?? fallback.business_expenses ?? [],
    job_photos: parsed.job_photos ?? {},
    vehicles: parsed.vehicles ?? fallback.vehicles ?? [],
    damage_docs: parsed.damage_docs ?? fallback.damage_docs ?? [],
  }

  // Phone may still have demo saved from an earlier visit — drop it when cloud is configured.
  if (isPocketBaseConfigured() && isDemoAppData(merged)) {
    localStorage.removeItem(scopedStorageKey(STORAGE_KEY))
    localStorage.removeItem(STORAGE_KEY)
    return createEmptyData()
  }

  return merged
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(data))
}

/** Replace local storage with demo seed data (local mode only). */
export function loadSampleData(): void {
  saveData(createSeedData())
}

export function newId(): string {
  return generateId()
}
