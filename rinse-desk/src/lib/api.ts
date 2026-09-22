import { isJobCapError, JOB_CAP_MESSAGE } from './job-allowance'
import { ClientResponseError } from 'pocketbase'
import { getPocketBase } from './pocketbase'
import { escapeFilter, formatPbError, orgFilter, requireOrganizationId } from './org'
import { compressJobPhoto } from './job-photos'
import { normalizeDeskInvoice } from './invoice-status'
import type { OverheadExpense } from '@/lib/rinse-core'
import type {
  DeskClient,
  DeskExpense,
  DeskInvoice,
  DeskInvoiceLineItem,
  DeskJob,
  DeskLead,
  DeskPackage,
  DeskQuote,
  DeskTimeBlock,
  DeskVehicle,
  DepositStatus,
  InvoiceStatus,
  JobStatus,
  LeadStage,
  QuoteStatus,
  RecurrenceCadence,
  VehicleType,
} from './types'

function mapClient(record: Record<string, unknown>): DeskClient {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    phone: record.phone ? String(record.phone) : undefined,
    email: record.email ? String(record.email) : undefined,
    address: record.address ? String(record.address) : undefined,
    lat:
      record.lat != null && record.lat !== '' && Number.isFinite(Number(record.lat))
        ? Number(record.lat)
        : undefined,
    lng:
      record.lng != null && record.lng !== '' && Number.isFinite(Number(record.lng))
        ? Number(record.lng)
        : undefined,
    geocoded_at: record.geocoded_at ? String(record.geocoded_at) : undefined,
    lead_source: record.lead_source ? String(record.lead_source) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
    parent_client_id: record.parent_client_id ? String(record.parent_client_id) : undefined,
    tags: Array.isArray(record.tags) ? (record.tags as string[]) : undefined,
    membership_cadence: record.membership_cadence
      ? (String(record.membership_cadence) as RecurrenceCadence)
      : undefined,
    membership_paused: record.membership_paused === true,
    membership_next_visit: record.membership_next_visit
      ? String(record.membership_next_visit)
      : undefined,
    created: record.created ? String(record.created) : undefined,
  }
}

function normalizeVehicleType(raw: unknown): VehicleType {
  const t = String(raw ?? 'sedan')
  if (t === 'sedan' || t === 'suv' || t === 'truck' || t === 'van' || t === 'boat' || t === 'other') {
    return t
  }
  // Legacy desk-only `coupe` (and any unknown PB value) → other
  return 'other'
}

function vehiclePhotoUrl(
  record: Record<string, unknown>,
  fileToken?: string,
): string | undefined {
  const photo = record.photo
  if (photo && !(Array.isArray(photo) && photo.length === 0)) {
    const filename = Array.isArray(photo) ? String(photo[0]) : String(photo)
    if (filename) {
      return getPocketBase().files.getURL(
        record,
        filename,
        fileToken ? { token: fileToken } : undefined,
      )
    }
  }
  // Legacy text field some records may still carry
  return record.photo_url ? String(record.photo_url) : undefined
}

function mapVehicle(record: Record<string, unknown>, fileToken?: string): DeskVehicle {
  return {
    id: String(record.id),
    client_id: String(record.client_id ?? ''),
    year: record.year != null && record.year !== '' ? Number(record.year) : undefined,
    make: String(record.make ?? ''),
    model: String(record.model ?? ''),
    color: record.color ? String(record.color) : undefined,
    color_hex: record.color_hex ? String(record.color_hex) : undefined,
    type: normalizeVehicleType(record.type),
    plate: record.plate ? String(record.plate) : undefined,
    vin: record.vin ? String(record.vin) : undefined,
    photo_url: vehiclePhotoUrl(record, fileToken),
  }
}

function mapJob(record: Record<string, unknown>, expand?: Record<string, unknown>): DeskJob {
  const clientExpand = expand?.client_id as Record<string, unknown> | undefined
  const packageExpand = expand?.package_id as Record<string, unknown> | undefined
  const rawStatus = String(record.status ?? 'scheduled')
  const status: JobStatus =
    rawStatus === 'scheduled' ||
    rawStatus === 'in_progress' ||
    rawStatus === 'completed' ||
    rawStatus === 'invoiced' ||
    rawStatus === 'paid' ||
    rawStatus === 'cancelled'
      ? rawStatus
      : 'scheduled'
  return {
    id: String(record.id),
    date: String(record.date ?? '').slice(0, 10),
    start_time: record.start_time ? String(record.start_time) : undefined,
    status,
    revenue: Number(record.revenue ?? 0),
    tip: Number(record.tip ?? 0),
    expenses: Array.isArray(record.expenses)
      ? (record.expenses as { amount?: unknown; category?: unknown; description?: unknown }[]).map((e) => ({
          amount: Number(e?.amount ?? 0),
          category: e?.category != null ? String(e.category) : undefined,
          description: e?.description != null ? String(e.description) : undefined,
        }))
      : [],
    travel_cost: Number(record.travel_cost ?? 0),
    marketing_cost: Number(record.marketing_cost ?? 0),
    equipment_depreciation: Number(record.equipment_depreciation ?? 0),
    client_id: String(record.client_id ?? ''),
    package_id: String(record.package_id ?? ''),
    notes: record.notes ? String(record.notes) : undefined,
    location_type: record.location_type ? String(record.location_type) : undefined,
    vehicle_type: record.vehicle_type ? String(record.vehicle_type) : undefined,
    route_order:
      record.route_order != null && record.route_order !== ''
        ? Number(record.route_order)
        : undefined,
    deposit_status: record.deposit_status
      ? (String(record.deposit_status) as DepositStatus)
      : undefined,
    deposit_amount:
      record.deposit_amount != null && record.deposit_amount !== ''
        ? Number(record.deposit_amount)
        : undefined,
    deposit_paid_at: record.deposit_paid_at ? String(record.deposit_paid_at) : undefined,
    invoice_id: record.invoice_id ? String(record.invoice_id) : undefined,
    hours_worked:
      record.hours_worked != null && record.hours_worked !== ''
        ? Number(record.hours_worked)
        : undefined,
    client: clientExpand ? mapClient(clientExpand) : undefined,
    packageName: packageExpand ? String(packageExpand.name ?? '') : undefined,
    created: record.created ? String(record.created) : undefined,
    updated: record.updated ? String(record.updated) : undefined,
  }
}

function mapLead(record: Record<string, unknown>, expand?: Record<string, unknown>): DeskLead {
  const packageExpand = expand?.package_id as Record<string, unknown> | undefined
  let stage = (record.stage as LeadStage) ?? 'inquiry'
  if (record.job_id) stage = 'booked'
  else if (record.quote_id && stage === 'inquiry') stage = 'quoted'
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    phone: record.phone ? String(record.phone) : undefined,
    email: record.email ? String(record.email) : undefined,
    stage,
    source: record.source ? String(record.source) : undefined,
    vehicle_type: record.vehicle_type ? String(record.vehicle_type) : undefined,
    service_interest: record.service_interest ? String(record.service_interest) : undefined,
    quote_amount: Number(record.quote_amount ?? 0),
    package_id: record.package_id ? String(record.package_id) : undefined,
    client_id: record.client_id ? String(record.client_id) : undefined,
    job_id: record.job_id ? String(record.job_id) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
    packageName: packageExpand ? String(packageExpand.name ?? '') : undefined,
    created: record.created ? String(record.created) : undefined,
  }
}

function mapInvoiceLine(raw: unknown): DeskInvoiceLineItem {
  const r = (raw ?? {}) as Record<string, unknown>
  const qty =
    typeof r.quantity === 'number' && Number.isFinite(r.quantity) ? Math.max(0, r.quantity) : 1
  const unitPrice =
    typeof r.unit_price === 'number' && Number.isFinite(r.unit_price)
      ? r.unit_price
      : Number(r.default_amount ?? 0)
  const unit =
    r.unit === 'hour' || r.unit === 'flat' || r.unit === 'each' ? r.unit : ('each' as const)
  const default_amount = Math.round(qty * unitPrice * 100) / 100
  return {
    id: String(r.id ?? ''),
    description: String(r.description ?? ''),
    quantity: qty,
    unit_price: unitPrice,
    unit,
    default_amount,
  }
}

function mapInvoice(record: Record<string, unknown>): DeskInvoice {
  const rawStatus = String(record.status ?? 'draft')
  const status: InvoiceStatus =
    rawStatus === 'draft' ||
    rawStatus === 'sent' ||
    rawStatus === 'paid' ||
    rawStatus === 'partial' ||
    rawStatus === 'overdue' ||
    rawStatus === 'void' ||
    rawStatus === 'cancelled'
      ? rawStatus
      : 'draft'
  const extras = Array.isArray(record.extra_line_items)
    ? record.extra_line_items
        .map(mapInvoiceLine)
        .filter((l) => l.description.trim().length > 0)
    : undefined
  return normalizeDeskInvoice({
    id: String(record.id),
    invoice_number: String(record.invoice_number ?? ''),
    job_id: String(record.job_id ?? ''),
    client_id: String(record.client_id ?? ''),
    subtotal: Number(record.subtotal ?? 0),
    tip: Number(record.tip ?? 0),
    total: Number(record.total ?? 0),
    status,
    amount_paid: Number(record.amount_paid ?? 0),
    balance_due: Number(record.balance_due ?? 0),
    paid_at: record.paid_at ? String(record.paid_at) : undefined,
    sent_at: record.sent_at ? String(record.sent_at) : undefined,
    created: record.created ? String(record.created) : undefined,
    discount_amount:
      record.discount_amount != null ? Number(record.discount_amount) : undefined,
    tax_rate: record.tax_rate != null ? Number(record.tax_rate) : undefined,
    tax_amount: record.tax_amount != null ? Number(record.tax_amount) : undefined,
    po_number: record.po_number ? String(record.po_number) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
    extra_line_items: extras,
  })
}

function expenseReceiptUrl(
  record: Record<string, unknown>,
  fileToken?: string,
): string | undefined {
  const receipt = record.receipt
  if (!receipt || (Array.isArray(receipt) && receipt.length === 0)) return undefined
  const filename = Array.isArray(receipt) ? String(receipt[0]) : String(receipt)
  if (!filename) return undefined
  const pb = getPocketBase()
  return pb.files.getURL(record, filename, fileToken ? { token: fileToken } : undefined)
}

function mapExpense(record: Record<string, unknown>, fileToken?: string): DeskExpense {
  const name = String(
    record.name ?? record.description ?? record.vendor ?? record.notes ?? 'Expense',
  ).trim() || 'Expense'
  return {
    id: String(record.id),
    amount: Number(record.amount ?? record.total ?? 0),
    name,
    description: name,
    date: String(record.date ?? record.created ?? '').slice(0, 10),
    category: record.category ? String(record.category) : undefined,
    vendor: record.vendor ? String(record.vendor) : undefined,
    receipt_url: expenseReceiptUrl(record, fileToken),
  }
}

function mapQuote(
  record: Record<string, unknown>,
  expand?: Record<string, unknown>,
): DeskQuote {
  const rawStatus = String(record.status ?? 'draft')
  const status: QuoteStatus =
    rawStatus === 'draft' ||
    rawStatus === 'sent' ||
    rawStatus === 'accepted' ||
    rawStatus === 'declined' ||
    rawStatus === 'expired'
      ? rawStatus
      : 'draft'
  const clientExpand = expand?.client_id as Record<string, unknown> | undefined
  const packageExpand = expand?.package_id as Record<string, unknown> | undefined
  const extras = Array.isArray(record.extra_line_items)
    ? record.extra_line_items
        .map(mapInvoiceLine)
        .filter((l) => l.description.trim().length > 0)
    : undefined
  const vehicleRaw = String(record.vehicle_type ?? 'sedan')
  const vehicle_type: VehicleType =
    vehicleRaw === 'sedan' ||
    vehicleRaw === 'suv' ||
    vehicleRaw === 'truck' ||
    vehicleRaw === 'van' ||
    vehicleRaw === 'boat' ||
    vehicleRaw === 'other'
      ? vehicleRaw
      : 'other'
  const locationRaw = String(record.location_type ?? 'mobile')
  return {
    id: String(record.id),
    quote_number: String(record.quote_number ?? ''),
    job_id: record.job_id ? String(record.job_id) : undefined,
    client_id: String(record.client_id ?? ''),
    package_id: String(record.package_id ?? ''),
    subtotal: Number(record.subtotal ?? 0),
    status,
    date: record.date ? String(record.date).slice(0, 10) : undefined,
    vehicle_type,
    location_type: locationRaw === 'shop' ? 'shop' : 'mobile',
    notes: record.notes ? String(record.notes) : undefined,
    valid_until: record.valid_until ? String(record.valid_until).slice(0, 10) : undefined,
    sent_at: record.sent_at ? String(record.sent_at) : undefined,
    created: record.created ? String(record.created) : undefined,
    extra_line_items: extras,
    clientName: clientExpand ? String(clientExpand.name ?? '') : undefined,
    packageName: packageExpand ? String(packageExpand.name ?? '') : undefined,
  }
}

async function listOrgRecords(collection: string, options: { sort?: string; expand?: string; limit?: number }) {
  const pb = getPocketBase()
  const filter = orgFilter()
  const limit = options.limit ?? 500

  const fetchPage = (opts: { sort?: string; expand?: string; filter?: string }) =>
    pb.collection(collection).getList(1, limit, {
      filter: opts.filter ?? filter,
      sort: opts.sort,
      expand: opts.expand,
    })

  // Prefer durable sorts: Fly schemas often lack `created`/`updated` autodates → HTTP 400 on -created/-updated.
  const preferredSort = options.sort
  const sortFallbacks: Array<string | undefined> = []
  if (preferredSort) sortFallbacks.push(preferredSort)
  if (preferredSort === '-created' || preferredSort === '-updated') {
    sortFallbacks.push('-id')
  }
  if (!sortFallbacks.includes(undefined)) sortFallbacks.push(undefined)

  const attempts: Array<{ sort?: string; expand?: string }> = []
  for (const sort of sortFallbacks) {
    if (options.expand) attempts.push({ sort, expand: options.expand })
    attempts.push({ sort, expand: undefined })
  }
  // Dedupe identical attempts
  const seen = new Set<string>()
  const uniqueAttempts = attempts.filter((a) => {
    const key = `${a.sort ?? ''}|${a.expand ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  let lastErr: unknown
  for (const attempt of uniqueAttempts) {
    try {
      const result = await fetchPage(attempt)
      return result.items
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

export async function listClients(limit = 500): Promise<DeskClient[]> {
  try {
    const items = await listOrgRecords('clients', { sort: 'name', limit })
    return items.map((item) => mapClient(item as unknown as Record<string, unknown>))
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not load clients'))
  }
}

export async function listVehicles(): Promise<DeskVehicle[]> {
  const pb = getPocketBase()

  async function withPhotoUrls(items: { id: string }[]): Promise<DeskVehicle[]> {
    let fileToken: string | undefined
    if (items.length > 0) {
      try {
        fileToken = await pb.files.getToken()
      } catch {
        fileToken = undefined
      }
    }
    return items.map((r) => mapVehicle(r as unknown as Record<string, unknown>, fileToken))
  }

  try {
    // Prefer direct org filter when `organization_id` exists on vehicles (multi-tenant).
    const items = await listOrgRecords('vehicles', { sort: '-id', limit: 500 })
    return await withPhotoUrls(items)
  } catch (orgErr) {
    // Fly / older schemas: vehicles may lack `organization_id` — orgFilter returns HTTP 400.
    // Scope through this org's clients instead (same approach as mobile per-client lists).
    try {
      const clients = await listOrgRecords('clients', { limit: 500 })
      if (clients.length === 0) return []

      const byId = new Map<string, DeskVehicle>()
      const chunkSize = 40
      for (let i = 0; i < clients.length; i += chunkSize) {
        const chunk = clients.slice(i, i + chunkSize)
        const filter = chunk
          .map((c) => `client_id = "${escapeFilter(String(c.id))}"`)
          .join(' || ')
        const result = await pb.collection('vehicles').getList(1, 500, {
          filter,
          sort: '-id',
        })
        const mapped = await withPhotoUrls(result.items)
        for (const v of mapped) byId.set(v.id, v)
      }
      return [...byId.values()]
    } catch {
      throw new Error(formatPbError(orgErr, 'Could not load vehicles'))
    }
  }
}

export async function listJobs(limit = 500): Promise<DeskJob[]> {
  try {
    const items = await listOrgRecords('jobs', {
      sort: '-date',
      expand: 'client_id,package_id',
      limit,
    })
    return items.map((item) =>
      mapJob(item as unknown as Record<string, unknown>, (item as { expand?: Record<string, unknown> }).expand),
    )
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not load jobs'))
  }
}

export async function listLeads(): Promise<DeskLead[]> {
  try {
    const items = await listOrgRecords('leads', {
      sort: '-id',
      expand: 'package_id',
      limit: 500,
    })
    return items.map((r) =>
      mapLead(r as unknown as Record<string, unknown>, (r as { expand?: Record<string, unknown> }).expand),
    )
  } catch (err) {
    console.warn('[desk] listLeads failed', err)
    return []
  }
}

export async function listInvoices(): Promise<DeskInvoice[]> {
  try {
    const items = await listOrgRecords('invoices', { sort: '-id', limit: 500 })
    return items.map((r) => mapInvoice(r as unknown as Record<string, unknown>))
  } catch (err) {
    console.warn('[desk] listInvoices failed', err)
    return []
  }
}

export async function listQuotes(): Promise<DeskQuote[]> {
  try {
    const items = await listOrgRecords('quotes', {
      sort: '-id',
      limit: 500,
      expand: 'client_id,package_id',
    })
    return items.map((r) =>
      mapQuote(
        r as unknown as Record<string, unknown>,
        (r as { expand?: Record<string, unknown> }).expand,
      ),
    )
  } catch {
    return []
  }
}

export async function createQuote(input: {
  client_id: string
  package_id: string
  vehicle_type?: VehicleType
  location_type?: 'mobile' | 'shop'
  date: string
  subtotal: number
  notes?: string
  valid_until?: string
  extra_line_items?: DeskInvoice['extra_line_items']
}): Promise<DeskQuote> {
  const pb = getPocketBase()
  const created = await pb.collection('quotes').create({
    organization_id: requireOrganizationId(),
    quote_number: 'PENDING',
    client_id: input.client_id,
    package_id: input.package_id,
    vehicle_type: input.vehicle_type ?? 'sedan',
    location_type: input.location_type ?? 'mobile',
    date: input.date,
    subtotal: input.subtotal,
    extra_line_items: input.extra_line_items ?? [],
    notes: input.notes ?? '',
    status: 'draft',
    valid_until: input.valid_until ?? '',
  })
  return mapQuote(created as unknown as Record<string, unknown>)
}

export async function updateQuote(
  id: string,
  patch: {
    status?: QuoteStatus
    subtotal?: number
    notes?: string
    date?: string
    valid_until?: string | null
    vehicle_type?: VehicleType
    location_type?: 'mobile' | 'shop'
    package_id?: string
    extra_line_items?: DeskInvoice['extra_line_items']
    sent_at?: string | null
    job_id?: string
  },
): Promise<DeskQuote> {
  const pb = getPocketBase()
  const updated = await pb.collection('quotes').update(id, patch)
  return mapQuote(updated as unknown as Record<string, unknown>)
}

export async function markQuoteSent(id: string): Promise<DeskQuote> {
  return updateQuote(id, {
    status: 'sent',
    sent_at: new Date().toISOString().slice(0, 10),
  })
}

/** Mobile parity: accept quote → create scheduled job + link. */
export async function acceptQuote(quoteId: string): Promise<{ quote: DeskQuote; job: DeskJob }> {
  const pb = getPocketBase()
  const record = await pb.collection('quotes').getOne(quoteId, { expand: 'client_id,package_id' })
  const quote = mapQuote(
    record as unknown as Record<string, unknown>,
    (record as { expand?: Record<string, unknown> }).expand,
  )
  if (quote.job_id) {
    const existing = await pb.collection('jobs').getOne(quote.job_id, { expand: 'client_id,package_id' })
    return {
      quote,
      job: mapJob(
        existing as unknown as Record<string, unknown>,
        (existing as { expand?: Record<string, unknown> }).expand,
      ),
    }
  }
  if (quote.status === 'declined' || quote.status === 'expired') {
    throw new Error('This quote cannot be accepted')
  }

  const job = await createJob({
    client_id: quote.client_id,
    package_id: quote.package_id,
    date: quote.date || new Date().toISOString().slice(0, 10),
    notes: quote.notes,
    revenue: quote.subtotal,
    vehicle_type: quote.vehicle_type,
  })

  const updated = await updateQuote(quoteId, {
    status: 'accepted',
    job_id: job.id,
  })
  return { quote: { ...updated, job_id: job.id }, job }
}

export async function deleteQuote(id: string): Promise<void> {
  const pb = getPocketBase()
  await pb.collection('quotes').delete(id)
}

export async function listExpenses(): Promise<DeskExpense[]> {
  try {
    const items = await listOrgRecords('business_expenses', { sort: '-date', limit: 500 })
    let fileToken: string | undefined
    if (items.length > 0) {
      try {
        fileToken = await getPocketBase().files.getToken()
      } catch {
        fileToken = undefined
      }
    }
    return items.map((r) => mapExpense(r as unknown as Record<string, unknown>, fileToken))
  } catch {
    return []
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
  try {
    const items = await listOrgRecords('overhead_expenses', { sort: 'name', limit: 200 })
    return items.map((r) => mapOverhead(r as unknown as Record<string, unknown>))
  } catch {
    return []
  }
}

export async function listPackages(): Promise<DeskPackage[]> {
  try {
    const items = await listOrgRecords('packages', { sort: 'name', limit: 200 })
    return items.map((r) => ({
      id: String(r.id),
      name: String((r as { name?: string }).name ?? ''),
      base_price: Number((r as { base_price?: number }).base_price ?? 0),
      active: Boolean((r as { active?: boolean }).active ?? true),
      deposit_amount:
        (r as { deposit_amount?: number }).deposit_amount != null
          ? Number((r as { deposit_amount?: number }).deposit_amount)
          : undefined,
    }))
  } catch {
    return []
  }
}

export async function createClient(input: {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  tags?: string[]
  parent_client_id?: string
  lat?: number
  lng?: number
  geocoded_at?: string
}): Promise<DeskClient> {
  const pb = getPocketBase()
  const created = await pb.collection('clients').create({
    name: input.name.trim(),
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    address: input.address?.trim() ?? '',
    notes: input.notes?.trim() ?? '',
    tags: input.tags ?? [],
    parent_client_id: input.parent_client_id ?? '',
    organization_id: requireOrganizationId(),
    created: new Date().toISOString(),
    ...(input.lat != null && input.lng != null
      ? { lat: input.lat, lng: input.lng, geocoded_at: input.geocoded_at ?? new Date().toISOString() }
      : {}),
  })
  return mapClient(created as unknown as Record<string, unknown>)
}

export async function updateClient(
  id: string,
  patch: {
    name?: string
    phone?: string
    email?: string
    address?: string
    notes?: string
    tags?: string[]
    parent_client_id?: string
    /** Pass null to clear stale map pins when the address changes. */
    lat?: number | null
    lng?: number | null
    geocoded_at?: string | null
  },
): Promise<DeskClient> {
  const pb = getPocketBase()
  const updated = await pb.collection('clients').update(id, patch)
  return mapClient(updated as unknown as Record<string, unknown>)
}

export async function deleteClient(id: string): Promise<void> {
  const pb = getPocketBase()
  await pb.collection('clients').delete(id)
}

export async function createVehicle(input: {
  client_id: string
  make: string
  model: string
  year?: number
  type?: VehicleType
  color?: string
  color_hex?: string
  plate?: string
  vin?: string
}): Promise<DeskVehicle> {
  const pb = getPocketBase()
  const body: Record<string, unknown> = {
    client_id: input.client_id,
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year ?? null,
    type: input.type ?? 'sedan',
    color: input.color?.trim() ?? '',
    color_hex: input.color_hex?.trim() ?? '',
    plate: input.plate?.trim() ?? '',
    vin: input.vin?.trim() ?? '',
    organization_id: requireOrganizationId(),
  }
  try {
    const created = await pb.collection('vehicles').create(body)
    return mapVehicle(created as unknown as Record<string, unknown>)
  } catch (err) {
    // Schema without organization_id rejects unknown field — retry without it.
    const status = err instanceof ClientResponseError ? err.status : 0
    if (status === 400 && 'organization_id' in body) {
      delete body.organization_id
      const created = await pb.collection('vehicles').create(body)
      return mapVehicle(created as unknown as Record<string, unknown>)
    }
    throw new Error(formatPbError(err, 'Could not create vehicle'))
  }
}

export async function createLead(input: {
  name: string
  phone?: string
  email?: string
  quote_amount?: number
  stage?: LeadStage
  service_interest?: string
  vehicle_type?: string
  package_id?: string
  source?: string
  client_id?: string
}): Promise<DeskLead> {
  const pb = getPocketBase()
  const created = await pb.collection('leads').create({
    name: input.name.trim(),
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    source: input.source ?? 'other',
    vehicle_type: input.vehicle_type ?? 'sedan',
    quote_amount: input.quote_amount ?? 0,
    stage: input.stage ?? 'inquiry',
    service_interest: input.service_interest?.trim() ?? '',
    package_id: input.package_id ?? '',
    client_id: input.client_id ?? '',
    organization_id: requireOrganizationId(),
  })
  return mapLead(created as unknown as Record<string, unknown>)
}

export async function updateLeadStage(id: string, stage: LeadStage): Promise<DeskLead> {
  return updateLead(id, { stage })
}

export async function updateLead(
  id: string,
  patch: {
    stage?: LeadStage
    quote_amount?: number
    name?: string
    service_interest?: string
    phone?: string
    email?: string
    notes?: string
    package_id?: string
  },
): Promise<DeskLead> {
  const pb = getPocketBase()
  const body: Record<string, unknown> = {}
  if (patch.stage !== undefined) body.stage = patch.stage
  if (patch.quote_amount !== undefined) body.quote_amount = patch.quote_amount
  if (patch.name !== undefined) body.name = patch.name.trim()
  if (patch.service_interest !== undefined) body.service_interest = patch.service_interest.trim()
  if (patch.phone !== undefined) body.phone = patch.phone.trim()
  if (patch.email !== undefined) body.email = patch.email.trim()
  if (patch.notes !== undefined) body.notes = patch.notes.trim()
  if (patch.package_id !== undefined) body.package_id = patch.package_id
  const updated = await pb.collection('leads').update(id, body, { expand: 'package_id' })
  return mapLead(
    updated as unknown as Record<string, unknown>,
    (updated as { expand?: Record<string, unknown> }).expand,
  )
}

export async function deleteLead(id: string): Promise<void> {
  const pb = getPocketBase()
  try {
    await pb.collection('leads').delete(id)
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not delete deal'))
  }
}

export async function createPackage(input: {
  name: string
  base_price?: number
  active?: boolean
  deposit_amount?: number
}): Promise<DeskPackage> {
  const pb = getPocketBase()
  const created = await pb.collection('packages').create({
    name: input.name.trim(),
    base_price: input.base_price ?? 0,
    active: input.active ?? true,
    deposit_amount: input.deposit_amount ?? 0,
    organization_id: requireOrganizationId(),
  })
  return {
    id: String(created.id),
    name: String((created as { name?: string }).name ?? ''),
    base_price: Number((created as { base_price?: number }).base_price ?? 0),
    active: Boolean((created as { active?: boolean }).active ?? true),
    deposit_amount:
      (created as { deposit_amount?: number }).deposit_amount != null
        ? Number((created as { deposit_amount?: number }).deposit_amount)
        : undefined,
  }
}

export async function updatePackage(
  id: string,
  patch: Partial<Pick<DeskPackage, 'name' | 'base_price' | 'active' | 'deposit_amount'>>,
): Promise<DeskPackage> {
  const pb = getPocketBase()
  const updated = await pb.collection('packages').update(id, patch)
  return {
    id: String(updated.id),
    name: String((updated as { name?: string }).name ?? ''),
    base_price: Number((updated as { base_price?: number }).base_price ?? 0),
    active: Boolean((updated as { active?: boolean }).active ?? true),
    deposit_amount:
      (updated as { deposit_amount?: number }).deposit_amount != null
        ? Number((updated as { deposit_amount?: number }).deposit_amount)
        : undefined,
  }
}

export async function convertLeadToJob(
  leadId: string,
  options: { date?: string; start_time?: string } = {},
): Promise<{ job: DeskJob; lead: DeskLead; client: DeskClient }> {
  const pb = getPocketBase()
  const leadRecord = await pb.collection('leads').getOne(leadId, { expand: 'package_id' })
  const lead = mapLead(
    leadRecord as unknown as Record<string, unknown>,
    (leadRecord as { expand?: Record<string, unknown> }).expand,
  )

  if (lead.job_id) {
    const existing = await pb.collection('jobs').getOne(lead.job_id, { expand: 'client_id,package_id' })
    const job = mapJob(
      existing as unknown as Record<string, unknown>,
      (existing as { expand?: Record<string, unknown> }).expand,
    )
    const client = job.client ?? (await listClients()).find((c) => c.id === lead.client_id)!
    return { job, lead, client }
  }

  let client: DeskClient
  if (lead.client_id) {
    const existing = await pb.collection('clients').getOne(lead.client_id)
    client = mapClient(existing as unknown as Record<string, unknown>)
  } else {
    client = await createClient({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      notes: lead.notes,
    })
  }

  const packages = await listPackages()
  const pkgId = lead.package_id || packages[0]?.id
  if (!pkgId) throw new Error('Select a service package on the lead (or create a package on mobile) before booking.')

  const pkg = packages.find((p) => p.id === pkgId)
  const revenue = lead.quote_amount > 0 ? lead.quote_amount : (pkg?.base_price ?? 0)
  const jobDate = options.date ?? new Date().toISOString().slice(0, 10)

  const job = await createJob({
    client_id: client.id,
    package_id: pkgId,
    date: jobDate,
    start_time: options.start_time,
    notes: lead.service_interest ?? lead.notes,
    revenue,
    vehicle_type: lead.vehicle_type,
  })

  const updatedLead = await pb.collection('leads').update(
    leadId,
    { client_id: client.id, job_id: job.id, stage: 'booked', package_id: pkgId },
    { expand: 'package_id' },
  )

  return {
    job,
    client,
    lead: mapLead(
      updatedLead as unknown as Record<string, unknown>,
      (updatedLead as { expand?: Record<string, unknown> }).expand,
    ),
  }
}

export async function updateJob(
  id: string,
  patch: Partial<
    Pick<
      DeskJob,
      | 'notes'
      | 'date'
      | 'start_time'
      | 'status'
      | 'route_order'
      | 'deposit_status'
      | 'hours_worked'
      | 'client_id'
      | 'package_id'
    >
  >,
): Promise<DeskJob> {
  const pb = getPocketBase()
  try {
    const updated = await pb.collection('jobs').update(id, patch, {
      expand: 'client_id,package_id',
    }).catch((error) => { if (isJobCapError(error)) throw new Error(JOB_CAP_MESSAGE); throw error })
    return mapJob(
      updated as unknown as Record<string, unknown>,
      (updated as { expand?: Record<string, unknown> }).expand,
    )
  } catch (err) {
    throw err
  }
}

export async function deleteJob(id: string): Promise<void> {
  // Hard DELETE is rejected on Fly (HTTP 400 — likely relation constraints / delete rules).
  // Calendar "delete" soft-cancels so the event leaves the schedule without removing the row.
  const pb = getPocketBase()
  try {
    await pb.collection('jobs').update(id, { status: 'cancelled' })
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not delete event'))
  }
}

export async function listTimeBlocks(fromDate: string, toDate: string): Promise<DeskTimeBlock[]> {
  try {
    const pb = getPocketBase()
    const from = fromDate.slice(0, 10)
    const to = toDate.slice(0, 10)
    const filter = `${orgFilter()} && date >= "${escapeFilter(from)}" && date <= "${escapeFilter(to)}"`
    const records = await pb.collection('time_blocks').getFullList({
      filter,
      sort: 'date,start_time',
    })
    return records.map((r) => mapTimeBlock(r as unknown as Record<string, unknown>))
  } catch {
    return []
  }
}

function mapTimeBlock(row: Record<string, unknown>): DeskTimeBlock {
  return {
    id: String(row.id),
    date: String(row.date ?? '').slice(0, 10),
    start_time: row.start_time ? String(row.start_time) : undefined,
    end_time: row.end_time ? String(row.end_time) : undefined,
    all_day: Boolean(row.all_day),
    label: row.label ? String(row.label) : undefined,
  }
}

export async function createTimeBlock(input: {
  date: string
  all_day?: boolean
  start_time?: string
  end_time?: string
  label?: string
}): Promise<DeskTimeBlock> {
  const pb = getPocketBase()
  const allDay = input.all_day === true
  try {
    const created = await pb.collection('time_blocks').create({
      organization_id: requireOrganizationId(),
      date: input.date.slice(0, 10),
      start_time: allDay ? '' : (input.start_time?.trim() ?? ''),
      end_time: allDay ? '' : (input.end_time?.trim() ?? ''),
      all_day: allDay,
      label: input.label?.trim() ?? '',
    })
    return mapTimeBlock(created as unknown as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not create time block'))
  }
}

export async function updateTimeBlock(
  id: string,
  patch: {
    date?: string
    all_day?: boolean
    start_time?: string
    end_time?: string
    label?: string
  },
): Promise<DeskTimeBlock> {
  const pb = getPocketBase()
  const body: Record<string, unknown> = {}
  if (patch.date !== undefined) body.date = patch.date.slice(0, 10)
  if (patch.all_day !== undefined) {
    body.all_day = patch.all_day
    if (patch.all_day) {
      body.start_time = ''
      body.end_time = ''
    }
  }
  if (patch.start_time !== undefined && patch.all_day !== true) {
    body.start_time = patch.start_time.trim()
  }
  if (patch.end_time !== undefined && patch.all_day !== true) {
    body.end_time = patch.end_time.trim()
  }
  if (patch.label !== undefined) body.label = patch.label.trim()
  try {
    const updated = await pb.collection('time_blocks').update(id, body)
    return mapTimeBlock(updated as unknown as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not update time block'))
  }
}

export async function deleteTimeBlock(id: string): Promise<void> {
  const pb = getPocketBase()
  try {
    await pb.collection('time_blocks').delete(id)
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not delete time block'))
  }
}

/** Time-off blocks for a single calendar day (mobile `getTimeBlocksOnDate`). */
export async function getTimeBlocksOnDate(date: string): Promise<DeskTimeBlock[]> {
  const day = date.slice(0, 10)
  return listTimeBlocks(day, day)
}

/** Deletes every time-off block on a calendar day. Returns how many were removed. */
export async function deleteTimeBlocksOnDate(date: string): Promise<number> {
  const blocks = await getTimeBlocksOnDate(date)
  let removed = 0
  for (const block of blocks) {
    try {
      await deleteTimeBlock(block.id)
      removed += 1
    } catch {
      /* continue — remove as many as possible */
    }
  }
  return removed
}

export async function saveRouteOrder(orderedJobIds: string[]): Promise<void> {
  await Promise.all(orderedJobIds.map((id, index) => updateJob(id, { route_order: index + 1 })))
}

export async function createJob(input: {
  client_id: string
  package_id: string
  date: string
  start_time?: string
  notes?: string
  revenue?: number
  vehicle_type?: string
  hours_worked?: number
}): Promise<DeskJob> {
  const pb = getPocketBase()
  const created = await pb.collection('jobs').create(
    {
      client_id: input.client_id,
      package_id: input.package_id,
      date: input.date,
      start_time: input.start_time ?? '',
      notes: input.notes ?? '',
      status: 'scheduled',
      revenue: input.revenue ?? 0,
      tip: 0,
      hours_worked: input.hours_worked ?? (input.start_time ? 1 : 0),
      location_type: 'mobile',
      vehicle_type: input.vehicle_type ?? 'sedan',
      photo_count: 0,
      travel_cost: 0,
      marketing_cost: 0,
      equipment_depreciation: 0,
      expenses: [],
      supplies_used: [],
      organization_id: requireOrganizationId(),
    },
    { expand: 'client_id,package_id' },
  ).catch((error) => { if (isJobCapError(error)) throw new Error(JOB_CAP_MESSAGE); throw error })
  return mapJob(
    created as unknown as Record<string, unknown>,
    (created as { expand?: Record<string, unknown> }).expand,
  )
}

async function mapExpenseWithToken(record: Record<string, unknown>): Promise<DeskExpense> {
  const pb = getPocketBase()
  let fileToken: string | undefined
  try {
    fileToken = await pb.files.getToken()
  } catch {
    fileToken = undefined
  }
  return mapExpense(record, fileToken)
}

function isReceiptPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

function isReceiptImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  // Some OS pickers leave type empty — fall back to extension.
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?)$/i.test(file.name)
}

/** Compress receipt images before PB upload (reuse job-photo limits). */
async function prepareReceiptFile(file: File): Promise<File> {
  if (isReceiptPdf(file)) return file
  if (!isReceiptImage(file)) {
    throw new Error('Receipt must be an image or PDF')
  }
  return compressJobPhoto(file)
}

/** PocketBase `business_expenses.category` select values (mobile parity). */
const PB_EXPENSE_CATEGORIES = [
  'legal',
  'licensing',
  'taxes',
  'insurance',
  'vehicle',
  'marketing',
  'software',
  'equipment',
  'supplies',
  'other',
] as const

/** Map Desk UI labels (e.g. Supplies) onto PB select values. */
function toPbExpenseCategory(raw?: string): string {
  const key = (raw || '').trim().toLowerCase()
  if (!key) return 'other'
  if ((PB_EXPENSE_CATEGORIES as readonly string[]).includes(key)) return key
  const deskMap: Record<string, string> = {
    chemicals: 'supplies',
    fuel: 'vehicle',
    tools: 'equipment',
  }
  return deskMap[key] ?? 'other'
}

export async function createExpense(input: {
  amount: number
  description: string
  date?: string
  category?: string
  receipt?: File
}): Promise<DeskExpense> {
  const pb = getPocketBase()
  const name = input.description.trim()
  const date = input.date ?? new Date().toISOString().slice(0, 10)
  const category = toPbExpenseCategory(input.category)
  const orgId = requireOrganizationId()

  try {
    if (input.receipt) {
      const receipt = await prepareReceiptFile(input.receipt)
      const formData = new FormData()
      formData.append('amount', String(input.amount))
      formData.append('name', name)
      formData.append('date', date)
      formData.append('category', category)
      formData.append('organization_id', orgId)
      formData.append('receipt', receipt, receipt.name)
      const created = await pb.collection('business_expenses').create(formData)
      return mapExpenseWithToken(created as unknown as Record<string, unknown>)
    }

    const created = await pb.collection('business_expenses').create({
      amount: input.amount,
      name,
      date,
      category,
      organization_id: orgId,
    })
    return mapExpense(created as unknown as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not log expense'))
  }
}

export async function updateExpense(
  id: string,
  patch: Partial<Pick<DeskExpense, 'amount' | 'description' | 'name' | 'date' | 'category'>>,
): Promise<DeskExpense> {
  const pb = getPocketBase()
  const body: Record<string, unknown> = {}
  if (patch.amount != null) body.amount = patch.amount
  const label = patch.name ?? patch.description
  if (label != null) {
    body.name = label.trim()
  }
  if (patch.date != null) body.date = patch.date
  if (patch.category != null) body.category = toPbExpenseCategory(patch.category)
  try {
    const updated = await pb.collection('business_expenses').update(id, body)
    return mapExpenseWithToken(updated as unknown as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not update expense'))
  }
}

/** Attach or replace the receipt image on a business expense (`receipt` file field). */
export async function uploadExpenseReceipt(id: string, file: File): Promise<DeskExpense> {
  const pb = getPocketBase()
  try {
    const receipt = await prepareReceiptFile(file)
    const formData = new FormData()
    formData.append('receipt', receipt, receipt.name)
    const updated = await pb.collection('business_expenses').update(id, formData)
    const mapped = await mapExpenseWithToken(updated as unknown as Record<string, unknown>)
    if (!mapped.receipt_url) {
      throw new Error('Receipt uploaded but could not be loaded')
    }
    return mapped
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Receipt')) throw err
    throw new Error(formatPbError(err, 'Could not upload receipt'))
  }
}

export async function updateInvoice(
  id: string,
  patch: {
    status?: InvoiceStatus
    total?: number
    subtotal?: number
    tip?: number
    amount_paid?: number
    balance_due?: number
    paid_at?: string | null
    sent_at?: string | null
    payments?: Array<{ amount: number; method: string; date: string; note?: string }>
    discount_amount?: number
    tax_rate?: number
    tax_amount?: number
    po_number?: string
    notes?: string
    extra_line_items?: DeskInvoice['extra_line_items']
  },
): Promise<DeskInvoice> {
  const pb = getPocketBase()
  const updated = await pb.collection('invoices').update(id, patch)
  return mapInvoice(updated as unknown as Record<string, unknown>)
}

/** Mobile parity: draft → sent with sent_at stamp. */
export async function markInvoiceSent(id: string): Promise<DeskInvoice> {
  return updateInvoice(id, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  })
}

/**
 * Create (or return existing) draft invoice for a job — Desk parity with mobile
 * `createInvoiceForJob` (rinse-api invoices-pocketbase).
 */
export async function createInvoiceForJob(jobId: string): Promise<DeskInvoice> {
  const pb = getPocketBase()
  const jobFilter = `${orgFilter()} && job_id = "${escapeFilter(jobId)}"`
  try {
    const existing = await pb.collection('invoices').getFullList({
      filter: jobFilter,
    })
    if (existing.length > 0) {
      return mapInvoice(existing[0] as unknown as Record<string, unknown>)
    }
  } catch {
    /* fall through to create */
  }

  const job = await pb.collection('jobs').getOne(jobId)
  const clientId = String((job as { client_id?: unknown }).client_id ?? '')
  if (!clientId) throw new Error('This job has no client — assign a contact first.')

  const revenue = Number((job as { revenue?: unknown }).revenue ?? 0)
  const tip = Number((job as { tip?: unknown }).tip ?? 0)
  const total = revenue + tip

  const depositStatus = String((job as { deposit_status?: unknown }).deposit_status ?? '')
  const depositAmount = Number((job as { deposit_amount?: unknown }).deposit_amount ?? 0)
  const depositPaidAt = (job as { deposit_paid_at?: unknown }).deposit_paid_at
    ? String((job as { deposit_paid_at?: unknown }).deposit_paid_at)
    : undefined

  const depositPaid = depositStatus === 'paid' && depositAmount > 0 ? depositAmount : 0
  const payments =
    depositPaid > 0
      ? [
          {
            id: `dep_${jobId}`,
            amount: depositPaid,
            method: 'stripe',
            date: depositPaidAt || new Date().toISOString(),
            note: 'Deposit paid at booking',
          },
        ]
      : []
  const amountPaid = depositPaid
  const balanceDue = Math.max(0, total - amountPaid)
  const status = balanceDue === 0 && total > 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'draft'

  const body: Record<string, unknown> = {
    invoice_number: 'PENDING',
    job_id: jobId,
    client_id: clientId,
    subtotal: revenue,
    tip,
    total,
    status,
    payments,
    amount_paid: amountPaid,
    balance_due: balanceDue,
    terms: 'Due on receipt',
    organization_id: requireOrganizationId(),
  }

  let created
  try {
    created = await pb.collection('invoices').create(body)
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 400 && 'organization_id' in body) {
      delete body.organization_id
      created = await pb.collection('invoices').create(body)
    } else {
      throw err
    }
  }

  try {
    await pb.collection('jobs').update(jobId, {
      invoice_id: (created as { id: string }).id,
      status: 'invoiced',
    })
  } catch {
    /* job status / invoice_id may be restricted — invoice still created */
  }

  return mapInvoice(created as unknown as Record<string, unknown>)
}

/**
 * Prefer an existing draft for the job (or any draft); otherwise create from job.
 */
export async function ensureDraftInvoiceForJob(
  jobId: string,
  invoices: DeskInvoice[],
): Promise<DeskInvoice> {
  const forJob = invoices.find((i) => i.job_id === jobId && i.status === 'draft')
  if (forJob) return forJob
  const anyDraft = invoices.find((i) => i.status === 'draft')
  if (anyDraft) return anyDraft
  return createInvoiceForJob(jobId)
}

/**
 * Mobile parity: record a payment for the remaining balance (cash by default).
 * Updates payments[], amount_paid, balance_due, status, paid_at; marks job paid when fully paid.
 */
export async function markInvoicePaid(id: string, method = 'cash'): Promise<DeskInvoice> {
  const pb = getPocketBase()
  const record = await pb.collection('invoices').getOne(id)
  const current = mapInvoice(record as unknown as Record<string, unknown>)
  if (current.balance_due <= 0) return current

  const existingPayments = Array.isArray((record as unknown as { payments?: unknown }).payments)
    ? ((record as unknown as {
        payments: Array<{ amount: number; method: string; date: string; note?: string }>
      }).payments)
    : []
  const payment = {
    amount: current.balance_due,
    method,
    date: new Date().toISOString().slice(0, 10),
  }
  const payments = [...existingPayments, payment]
  const amount_paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const balance_due = Math.max(0, current.total - amount_paid)
  // Persist derived status (partial can age into overdue) — mapInvoice also normalizes on read.
  const status = normalizeDeskInvoice({
    ...current,
    amount_paid,
    balance_due,
    status: balance_due <= 0 ? 'paid' : amount_paid > 0 ? 'partial' : current.status,
  }).status
  const paid_at = status === 'paid' ? new Date().toISOString() : current.paid_at ?? null

  const updated = await pb.collection('invoices').update(id, {
    payments,
    amount_paid,
    balance_due,
    status,
    paid_at: paid_at ?? '',
  })

  if (status === 'paid' && current.job_id) {
    try {
      await pb.collection('jobs').update(current.job_id, { status: 'paid' })
    } catch (err) {
      console.warn('[desk] mark job paid after invoice failed', err)
    }
  }

  return mapInvoice(updated as unknown as Record<string, unknown>)
}

export { escapeFilter, mapClient, mapJob }
