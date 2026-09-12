import { getPocketBase } from '../pocketbase'
import { appJobCreateToPb, pbClientToApp, pbJobToApp, pbLeadToApp, pbLeadToAppWithRelations, pbPackageToApp, pbQuoteToApp, escapeFilterValue, type PbRecord } from './mappers'
import { isMissingCollectionError } from './pb-errors'
import { clearLeadsCollectionMissing, markLeadsCollectionMissing } from './leads-migration'
import { rethrowPremiumPocketBaseError } from '../premium-api'
import { withOrganization } from './tenant-pocketbase'
import type { Client, Lead, LeadInput, LeadStage, LeadWithRelations, Quote } from '../types'
import { createClient } from './pocketbase'

const LEADS_MIGRATION_HINT =
  'Lead pipeline is not set up on the server yet. Run PocketBase migrations: cd pocketbase && ./pocketbase migrate up — then restart PocketBase.'

const LEAD_EXPAND = 'package_id,quote_id,client_id'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
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

export async function getLeads(): Promise<LeadWithRelations[]> {
  try {
    const records = await pb().collection('leads').getFullList<PbRecord>({
      sort: '-id',
      expand: LEAD_EXPAND,
    })
    clearLeadsCollectionMissing()
    return records.map(pbLeadToAppWithRelations)
  } catch (err) {
    if (isMissingCollectionError(err)) {
      markLeadsCollectionMissing()
      console.warn('[leads]', LEADS_MIGRATION_HINT)
      return []
    }
    throw err
  }
}

export async function getLead(id: string): Promise<LeadWithRelations | null> {
  try {
    const record = await pb().collection('leads').getOne<PbRecord>(id, { expand: LEAD_EXPAND })
    return pbLeadToAppWithRelations(record)
  } catch (err) {
    if (isMissingCollectionError(err)) return null
    return null
  }
}

export async function createLead(input: LeadInput): Promise<Lead> {
  try {
    const created = await pb().collection('leads').create<PbRecord>(
      withOrganization(leadPayload(input)),
    )
    return pbLeadToApp(created)
  } catch (err) {
    if (isMissingCollectionError(err)) throw new Error(LEADS_MIGRATION_HINT)
    rethrowPremiumPocketBaseError(err)
  }
}

export async function updateLead(id: string, input: Partial<LeadInput>): Promise<Lead | null> {
  try {
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
    const updated = await pb().collection('leads').update<PbRecord>(id, payload)
    return pbLeadToApp(updated)
  } catch (err) {
    if (isMissingCollectionError(err)) return null
    rethrowPremiumPocketBaseError(err)
  }
}

async function requireLeadUpdate(
  id: string,
  input: Partial<LeadInput>,
  errorMessage: string,
): Promise<Lead> {
  const updated = await updateLead(id, input)
  if (!updated) throw new Error(errorMessage)
  return updated
}

export async function updateLeadStage(id: string, stage: LeadStage): Promise<Lead | null> {
  return updateLead(id, { stage })
}

export async function deleteLead(id: string): Promise<boolean> {
  try {
    await pb().collection('leads').delete(id)
    return true
  } catch (err) {
    if (isMissingCollectionError(err)) return false
    return false
  }
}

function defaultQuoteDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

export async function ensureLeadClient(lead: Lead): Promise<Client> {
  if (lead.client_id) {
    const existing = await pb().collection('clients').getOne<PbRecord>(lead.client_id)
    return pbClientToApp(existing)
  }
  const client = await createClient({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    lead_source: lead.source,
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
  const pkg = await pb().collection('packages').getOne<PbRecord>(lead.package_id)
  const packageApp = pbPackageToApp(pkg)
  const subtotal = lead.quote_amount && lead.quote_amount > 0 ? lead.quote_amount : packageApp.base_price

  try {
    const created = await pb().collection('quotes').create<PbRecord>(
      withOrganization({
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
      }),
    )
    const quote = pbQuoteToApp(created)
    await requireLeadUpdate(
      leadId,
      { client_id: client.id, quote_id: quote.id, stage: 'quoted' },
      'Quote created but lead could not move to Quoted. Try again.',
    )
    return quote
  } catch (err) {
    rethrowPremiumPocketBaseError(err)
  }
}

export interface ConvertLeadToJobOptions {
  date?: string
  start_time?: string
}

export async function convertLeadToJob(
  leadId: string,
  options: ConvertLeadToJobOptions = {}
): Promise<{ jobId: string; clientId: string }> {
  const lead = await getLead(leadId)
  if (!lead) throw new Error('Lead not found')
  if (lead.job_id) return { jobId: lead.job_id, clientId: lead.client_id ?? '' }

  if (!lead.package_id) throw new Error('Select a service package before booking')

  const client = await ensureLeadClient(lead)
  const pkg = await pb().collection('packages').getOne<PbRecord>(lead.package_id)
  const packageApp = pbPackageToApp(pkg)
  const revenue = lead.quote_amount && lead.quote_amount > 0 ? lead.quote_amount : packageApp.base_price
  const jobDate = options.date ?? defaultQuoteDate()

  const payload = appJobCreateToPb({
    date: jobDate,
    location_type: 'mobile',
    package_id: lead.package_id,
    vehicle_type: lead.vehicle_type,
    client_id: client.id,
    status: 'scheduled',
    revenue,
    tip: 0,
    start_time: options.start_time,
    notes: lead.service_interest ?? lead.notes ?? '',
  })

  try {
    const jobRecord = await pb().collection('jobs').create<PbRecord>(
      withOrganization(payload as Record<string, unknown>),
    )
    const job = pbJobToApp(jobRecord)
    await requireLeadUpdate(
      leadId,
      { client_id: client.id, job_id: job.id, stage: 'booked' },
      'Job created but lead could not move to Scheduled. Try again.',
    )
    return { jobId: job.id, clientId: client.id }
  } catch (err) {
    rethrowPremiumPocketBaseError(err)
  }
}

export async function syncLeadForQuoteJob(quoteId: string, jobId: string): Promise<void> {
  try {
    const records = await pb().collection('leads').getFullList<PbRecord>({
      filter: `quote_id = "${escapeFilterValue(quoteId)}"`,
      limit: 1,
    })
    if (records.length === 0) return
    await updateLead(records[0].id, { job_id: jobId, stage: 'booked' })
  } catch (err) {
    if (isMissingCollectionError(err)) return
  }
}

/** Promote inquiry leads to quoted when their quote is marked sent. */
export async function syncLeadForQuoteSent(quoteId: string): Promise<void> {
  try {
    const records = await pb().collection('leads').getFullList<PbRecord>({
      filter: `quote_id = "${escapeFilterValue(quoteId)}" && stage = "inquiry"`,
      limit: 1,
    })
    if (records.length === 0) return
    await updateLead(records[0].id, { stage: 'quoted' })
  } catch (err) {
    if (isMissingCollectionError(err)) return
  }
}
