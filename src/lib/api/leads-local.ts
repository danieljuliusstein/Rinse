import { loadData, newId, saveData } from '../storage'
import { createClient } from './local'
import type { Client, Lead, LeadInput, LeadStage, LeadWithRelations, Quote } from '../types'

function enrich(lead: Lead): LeadWithRelations {
  const data = loadData()
  return {
    ...lead,
    package: lead.package_id ? data.packages.find((p) => p.id === lead.package_id) : undefined,
    quote: lead.quote_id ? data.quotes?.find((q) => q.id === lead.quote_id) : undefined,
    client: lead.client_id ? data.clients.find((c) => c.id === lead.client_id) : undefined,
  }
}

function defaultQuoteDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

function nextQuoteNumber(): string {
  const data = loadData()
  const count = (data.quotes?.length ?? 0) + 1
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `QTE-${y}-${m}-${String(count).padStart(3, '0')}`
}

export function getLeads(): LeadWithRelations[] {
  const data = loadData()
  return (data.leads ?? []).map(enrich).sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''))
}

export function getLead(id: string): LeadWithRelations | null {
  const lead = loadData().leads?.find((l) => l.id === id)
  return lead ? enrich(lead) : null
}

export function createLead(input: LeadInput): Lead {
  const data = loadData()
  const lead: Lead = {
    id: newId(),
    name: input.name.trim(),
    phone: input.phone?.trim(),
    email: input.email?.trim(),
    source: input.source,
    vehicle_type: input.vehicle_type,
    package_id: input.package_id,
    service_interest: input.service_interest?.trim(),
    quote_amount: input.quote_amount,
    stage: input.stage ?? 'inquiry',
    client_id: input.client_id,
    quote_id: input.quote_id,
    job_id: input.job_id,
    notes: input.notes?.trim(),
    created: new Date().toISOString(),
  }
  data.leads = [...(data.leads ?? []), lead]
  saveData(data)
  return lead
}

export function updateLead(id: string, input: Partial<LeadInput>): Lead | null {
  const data = loadData()
  const idx = data.leads?.findIndex((l) => l.id === id) ?? -1
  if (idx < 0 || !data.leads) return null
  const current = data.leads[idx]
  const updated: Lead = {
    ...current,
    name: input.name !== undefined ? input.name.trim() : current.name,
    phone: input.phone !== undefined ? input.phone.trim() : current.phone,
    email: input.email !== undefined ? input.email.trim() : current.email,
    source: input.source ?? current.source,
    vehicle_type: input.vehicle_type ?? current.vehicle_type,
    package_id: input.package_id !== undefined ? input.package_id : current.package_id,
    service_interest:
      input.service_interest !== undefined ? input.service_interest.trim() : current.service_interest,
    quote_amount: input.quote_amount !== undefined ? input.quote_amount : current.quote_amount,
    stage: input.stage ?? current.stage,
    client_id: input.client_id !== undefined ? input.client_id : current.client_id,
    quote_id: input.quote_id !== undefined ? input.quote_id : current.quote_id,
    job_id: input.job_id !== undefined ? input.job_id : current.job_id,
    notes: input.notes !== undefined ? input.notes.trim() : current.notes,
  }
  data.leads[idx] = updated
  saveData(data)
  return updated
}

export function updateLeadStage(id: string, stage: LeadStage): Lead | null {
  return updateLead(id, { stage })
}

export function deleteLead(id: string): boolean {
  const data = loadData()
  const before = data.leads?.length ?? 0
  data.leads = (data.leads ?? []).filter((l) => l.id !== id)
  if ((data.leads?.length ?? 0) === before) return false
  saveData(data)
  return true
}

export function ensureLeadClient(lead: Lead): Client {
  if (lead.client_id) {
    const existing = loadData().clients.find((c) => c.id === lead.client_id)
    if (existing) return existing
  }
  const client = createClient({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    lead_source: lead.source,
    notes: lead.notes,
  })
  updateLead(lead.id, { client_id: client.id })
  return client
}

export function createQuoteForLead(leadId: string): Quote {
  const lead = getLead(leadId)
  if (!lead) throw new Error('Lead not found')
  if (!lead.package_id) throw new Error('Select a service package before sending a quote')

  const client = ensureLeadClient(lead)
  const data = loadData()
  const pkg = data.packages.find((p) => p.id === lead.package_id)
  const subtotal =
    lead.quote_amount && lead.quote_amount > 0 ? lead.quote_amount : (pkg?.base_price ?? 0)

  const quote: Quote = {
    id: newId(),
    quote_number: nextQuoteNumber(),
    client_id: client.id,
    package_id: lead.package_id,
    vehicle_type: lead.vehicle_type,
    location_type: 'mobile',
    date: defaultQuoteDate(),
    subtotal,
    notes: lead.service_interest ?? lead.notes ?? '',
    status: 'draft',
    created: new Date().toISOString(),
  }
  data.quotes = [...(data.quotes ?? []), quote]
  saveData(data)
  const updated = updateLead(leadId, { client_id: client.id, quote_id: quote.id, stage: 'quoted' })
  if (!updated) throw new Error('Quote created but lead could not move to Quoted. Try again.')
  return quote
}

export interface ConvertLeadToJobOptions {
  date?: string
  start_time?: string
}

export function convertLeadToJob(
  leadId: string,
  options: ConvertLeadToJobOptions = {}
): { jobId: string; clientId: string } {
  const lead = getLead(leadId)
  if (!lead) throw new Error('Lead not found')
  if (lead.job_id) return { jobId: lead.job_id, clientId: lead.client_id ?? '' }
  if (!lead.package_id) throw new Error('Select a service package before booking')

  const client = ensureLeadClient(lead)
  const data = loadData()
  const pkg = data.packages.find((p) => p.id === lead.package_id)
  const revenue =
    lead.quote_amount && lead.quote_amount > 0 ? lead.quote_amount : (pkg?.base_price ?? 0)

  const job = {
    id: newId(),
    date: options.date ?? defaultQuoteDate(),
    start_time: options.start_time,
    location_type: 'mobile' as const,
    package_id: lead.package_id,
    vehicle_type: lead.vehicle_type,
    client_id: client.id,
    status: 'scheduled' as const,
    revenue,
    tip: 0,
    hours_worked: 0,
    expenses: [],
    supplies_used: [],
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
    photo_count: 0,
    notes: lead.service_interest ?? lead.notes ?? '',
  }
  data.jobs = [...data.jobs, job]
  saveData(data)
  const updated = updateLead(leadId, { client_id: client.id, job_id: job.id, stage: 'booked' })
  if (!updated) throw new Error('Job created but lead could not move to Scheduled. Try again.')
  return { jobId: job.id, clientId: client.id }
}

export function syncLeadForQuoteJob(quoteId: string, jobId: string): void {
  const data = loadData()
  const lead = data.leads?.find((l) => l.quote_id === quoteId)
  if (!lead) return
  updateLead(lead.id, { job_id: jobId, stage: 'booked' })
}

/** Promote inquiry leads to quoted when their quote is marked sent. */
export function syncLeadForQuoteSent(quoteId: string): void {
  const data = loadData()
  const lead = data.leads?.find((l) => l.quote_id === quoteId)
  if (!lead || lead.stage !== 'inquiry') return
  updateLead(lead.id, { stage: 'quoted' })
}
