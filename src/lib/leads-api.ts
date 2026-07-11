import type { Client, Lead, LeadInput, LeadStage, LeadWithRelations, Package, Quote } from '@rinse/core'
import { createClient } from './api'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { resolveLeadStage } from '@/src/lib/lead-sources'
import { requireOrganizationId } from './org'

const LEAD_EXPAND = 'package_id,quote_id,client_id'

function mapClient(record: Record<string, unknown>): Client {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    phone: record.phone ? String(record.phone) : undefined,
    email: record.email ? String(record.email) : undefined,
    address: record.address ? String(record.address) : undefined,
  }
}

function mapPackage(record: Record<string, unknown>): Package {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    base_price: Number(record.base_price ?? 0),
    expected_return_days: Number(record.expected_return_days ?? 30),
    duration_minutes: Number(record.duration_minutes ?? 60),
    active: Boolean(record.active ?? true),
  }
}

function mapQuote(record: Record<string, unknown>): Quote {
  return {
    id: String(record.id),
    quote_number: String(record.quote_number ?? ''),
    client_id: String(record.client_id ?? ''),
    package_id: String(record.package_id ?? ''),
    vehicle_type: (record.vehicle_type as Quote['vehicle_type']) ?? 'sedan',
    location_type: (record.location_type as Quote['location_type']) ?? 'mobile',
    date: String(record.date ?? ''),
    subtotal: Number(record.subtotal ?? 0),
    status: (record.status as Quote['status']) ?? 'draft',
    notes: record.notes ? String(record.notes) : undefined,
    valid_until: record.valid_until ? String(record.valid_until) : undefined,
    job_id: record.job_id ? String(record.job_id) : undefined,
    sent_at: record.sent_at ? String(record.sent_at) : undefined,
    created: record.created ? String(record.created) : undefined,
  }
}

function mapLead(record: Record<string, unknown>, expand?: Record<string, unknown>): LeadWithRelations {
  const lead: LeadWithRelations = {
    id: String(record.id),
    name: String(record.name ?? ''),
    phone: record.phone ? String(record.phone) : undefined,
    email: record.email ? String(record.email) : undefined,
    source: (record.source as Lead['source']) ?? 'other',
    vehicle_type: (record.vehicle_type as Lead['vehicle_type']) ?? 'sedan',
    package_id: record.package_id ? String(record.package_id) : undefined,
    service_interest: record.service_interest ? String(record.service_interest) : undefined,
    quote_amount: record.quote_amount != null ? Number(record.quote_amount) : undefined,
    stage: (record.stage as Lead['stage']) ?? 'inquiry',
    client_id: record.client_id ? String(record.client_id) : undefined,
    quote_id: record.quote_id ? String(record.quote_id) : undefined,
    job_id: record.job_id ? String(record.job_id) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
    created: record.created ? String(record.created) : undefined,
  }

  const packageExpand = expand?.package_id as Record<string, unknown> | undefined
  const quoteExpand = expand?.quote_id as Record<string, unknown> | undefined
  const clientExpand = expand?.client_id as Record<string, unknown> | undefined
  if (packageExpand) lead.package = mapPackage(packageExpand)
  if (quoteExpand) lead.quote = mapQuote(quoteExpand)
  if (clientExpand) lead.client = mapClient(clientExpand)

  return lead
}

export async function listLeads(): Promise<LeadWithRelations[]> {
  if (!(await isOnline())) return []
  const orgId = requireOrganizationId()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const pb = getPocketBase()
  if (!pb.authStore.isValid) return []

  const records = await pb.collection('leads').getFullList({
    filter: `organization_id = "${escaped}"`,
    sort: '-id',
    expand: LEAD_EXPAND,
  })

  return records.map((r) => mapLead(r as Record<string, unknown>, (r as { expand?: Record<string, unknown> }).expand))
}

export async function createLead(input: LeadInput): Promise<Lead> {
  if (!(await isOnline())) throw new Error('Connect to the internet to create a lead.')
  const orgId = requireOrganizationId()
  const pb = getPocketBase()
  if (!pb.authStore.isValid) throw new Error('Sign in to create a lead.')

  const payload = {
    name: input.name.trim(),
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    source: input.source,
    vehicle_type: input.vehicle_type,
    package_id: input.package_id ?? '',
    service_interest: input.service_interest?.trim() ?? '',
    quote_amount: input.quote_amount ?? 0,
    stage: input.stage ?? 'inquiry',
    client_id: input.client_id ?? '',
    quote_id: input.quote_id ?? '',
    job_id: input.job_id ?? '',
    notes: input.notes?.trim() ?? '',
    organization_id: orgId,
  }

  const created = await pb.collection('leads').create(payload)
  return mapLead(created as Record<string, unknown>)
}

export function pipelineOpenCount(leads: LeadWithRelations[]): number {
  return leads.filter((l) => resolveLeadStage(l) !== 'booked').length
}

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function defaultQuoteDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

function leadPayload(input: LeadInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    source: input.source,
    vehicle_type: input.vehicle_type,
    package_id: input.package_id ?? '',
    service_interest: input.service_interest?.trim() ?? '',
    quote_amount: input.quote_amount ?? 0,
    stage: input.stage ?? 'inquiry',
    client_id: input.client_id ?? '',
    quote_id: input.quote_id ?? '',
    job_id: input.job_id ?? '',
    notes: input.notes?.trim() ?? '',
  }
}

export async function getLead(id: string): Promise<LeadWithRelations | null> {
  if (!(await isOnline())) return null
  try {
    const record = await pb().collection('leads').getOne(id, { expand: LEAD_EXPAND })
    return mapLead(record as Record<string, unknown>, (record as { expand?: Record<string, unknown> }).expand)
  } catch {
    return null
  }
}

export async function updateLead(id: string, input: Partial<LeadInput>): Promise<Lead | null> {
  if (!(await isOnline())) throw new Error('Connect to the internet to update this lead.')
  const payload: Record<string, unknown> = {}
  if (input.name !== undefined) payload.name = input.name.trim()
  if (input.phone !== undefined) payload.phone = input.phone.trim()
  if (input.email !== undefined) payload.email = input.email.trim()
  if (input.source !== undefined) payload.source = input.source
  if (input.vehicle_type !== undefined) payload.vehicle_type = input.vehicle_type
  if (input.package_id !== undefined) payload.package_id = input.package_id ?? ''
  if (input.service_interest !== undefined) payload.service_interest = input.service_interest.trim()
  if (input.quote_amount !== undefined) payload.quote_amount = input.quote_amount ?? 0
  if (input.stage !== undefined) payload.stage = input.stage
  if (input.client_id !== undefined) payload.client_id = input.client_id ?? ''
  if (input.quote_id !== undefined) payload.quote_id = input.quote_id ?? ''
  if (input.job_id !== undefined) payload.job_id = input.job_id ?? ''
  if (input.notes !== undefined) payload.notes = input.notes.trim()
  try {
    const updated = await pb().collection('leads').update(id, payload)
    return mapLead(updated as Record<string, unknown>)
  } catch {
    return null
  }
}

async function requireLeadUpdate(id: string, input: Partial<LeadInput>, errorMessage: string): Promise<Lead> {
  const updated = await updateLead(id, input)
  if (!updated) throw new Error(errorMessage)
  return updated
}

export async function updateLeadStage(id: string, stage: LeadStage): Promise<Lead | null> {
  return updateLead(id, { stage })
}

export async function deleteLead(id: string): Promise<boolean> {
  if (!(await isOnline())) return false
  try {
    await pb().collection('leads').delete(id)
    return true
  } catch {
    return false
  }
}

export async function ensureLeadClient(lead: Lead): Promise<Client> {
  if (lead.client_id) {
    const existing = await pb().collection('clients').getOne(lead.client_id)
    return mapClient(existing as Record<string, unknown>)
  }
  const client = await createClient({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    address: undefined,
    lead_source: lead.source === 'website' || lead.source === 'text' ? 'other' : lead.source,
    notes: lead.notes,
  })
  await updateLead(lead.id, { client_id: client.id })
  return client
}

export async function createQuoteForLead(leadId: string): Promise<Quote> {
  const lead = await getLead(leadId)
  if (!lead) throw new Error('Lead not found')
  if (!lead.package_id) throw new Error('Select a service package before sending a quote')

  const client = await ensureLeadClient(lead)
  const pkg = await pb().collection('packages').getOne(lead.package_id)
  const packageApp = mapPackage(pkg as Record<string, unknown>)
  const subtotal = lead.quote_amount && lead.quote_amount > 0 ? lead.quote_amount : packageApp.base_price

  const created = await pb().collection('quotes').create({
    organization_id: requireOrganizationId(),
    quote_number: 'PENDING',
    client_id: client.id,
    package_id: lead.package_id,
    vehicle_type: lead.vehicle_type,
    location_type: 'mobile',
    date: defaultQuoteDate(),
    subtotal,
    notes: lead.service_interest ?? lead.notes ?? '',
    status: 'draft',
    valid_until: '',
  })
  const quote = mapQuote(created as Record<string, unknown>)
  await requireLeadUpdate(
    leadId,
    { client_id: client.id, quote_id: quote.id, stage: 'quoted' },
    'Quote created but lead could not move to Quoted. Try again.',
  )
  return quote
}

export interface ConvertLeadToJobOptions {
  date?: string
  start_time?: string
}

export async function convertLeadToJob(
  leadId: string,
  options: ConvertLeadToJobOptions = {},
): Promise<{ jobId: string; clientId: string }> {
  const lead = await getLead(leadId)
  if (!lead) throw new Error('Lead not found')
  if (lead.job_id) return { jobId: lead.job_id, clientId: lead.client_id ?? '' }
  if (!lead.package_id) throw new Error('Select a service package before booking')

  const client = await ensureLeadClient(lead)
  const pkg = await pb().collection('packages').getOne(lead.package_id)
  const packageApp = mapPackage(pkg as Record<string, unknown>)
  const revenue = lead.quote_amount && lead.quote_amount > 0 ? lead.quote_amount : packageApp.base_price
  const jobDate = options.date ?? defaultQuoteDate()

  const jobRecord = await pb().collection('jobs').create({
    organization_id: requireOrganizationId(),
    date: jobDate,
    location_type: 'mobile',
    package_id: lead.package_id,
    vehicle_type: lead.vehicle_type,
    client_id: client.id,
    status: 'scheduled',
    revenue,
    tip: 0,
    start_time: options.start_time ?? '',
    notes: lead.service_interest ?? lead.notes ?? '',
    hours_worked: 0,
    expenses: [],
  })
  const jobId = String(jobRecord.id)
  await requireLeadUpdate(
    leadId,
    { client_id: client.id, job_id: jobId, stage: 'booked' },
    'Job created but lead could not move to Scheduled. Try again.',
  )
  return { jobId, clientId: client.id }
}
