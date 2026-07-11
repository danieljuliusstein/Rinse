import type { Client, Package, Quote, QuoteInput, QuoteWithRelations } from '@rinse/core'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'

const QUOTE_EXPAND = 'client_id,package_id'

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

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

function mapQuote(record: Record<string, unknown>, expand?: Record<string, unknown>): QuoteWithRelations {
  const quote: QuoteWithRelations = {
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

  const clientExpand = expand?.client_id as Record<string, unknown> | undefined
  const packageExpand = expand?.package_id as Record<string, unknown> | undefined
  if (clientExpand) quote.client = mapClient(clientExpand)
  if (packageExpand) quote.package = mapPackage(packageExpand)

  return quote
}

export async function listQuotes(): Promise<QuoteWithRelations[]> {
  if (!(await isOnline())) return []
  const orgId = requireOrganizationId()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb().collection('quotes').getFullList({
    filter: `organization_id = "${escaped}"`,
    sort: '-id',
    expand: QUOTE_EXPAND,
  })
  return records.map((r) =>
    mapQuote(r as Record<string, unknown>, (r as { expand?: Record<string, unknown> }).expand)
  )
}

export async function getQuote(id: string): Promise<QuoteWithRelations | null> {
  if (!(await isOnline())) return null
  try {
    const record = await pb().collection('quotes').getOne(id, { expand: QUOTE_EXPAND })
    return mapQuote(record as Record<string, unknown>, (record as { expand?: Record<string, unknown> }).expand)
  } catch {
    return null
  }
}

export async function createQuote(input: QuoteInput): Promise<Quote> {
  const orgId = requireOrganizationId()
  const created = await pb().collection('quotes').create({
    organization_id: orgId,
    quote_number: 'PENDING',
    client_id: input.client_id,
    package_id: input.package_id,
    vehicle_type: input.vehicle_type,
    location_type: input.location_type,
    date: input.date,
    subtotal: input.subtotal,
    notes: input.notes ?? '',
    status: 'draft',
    valid_until: input.valid_until ?? '',
  })
  return mapQuote(created as Record<string, unknown>)
}

export async function updateQuoteStatus(id: string, status: Quote['status']): Promise<Quote | null> {
  try {
    const payload: Record<string, unknown> = { status }
    if (status === 'sent') payload.sent_at = new Date().toISOString().slice(0, 10)
    const updated = await pb().collection('quotes').update(id, payload)
    return mapQuote(updated as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function acceptQuote(quoteId: string): Promise<{ quote: Quote; jobId: string } | null> {
  const quote = await getQuote(quoteId)
  if (!quote) return null
  if (quote.job_id) return { quote, jobId: quote.job_id }
  if (quote.status === 'declined' || quote.status === 'expired') return null

  const orgId = requireOrganizationId()
  const job = await pb().collection('jobs').create({
    organization_id: orgId,
    date: quote.date,
    client_id: quote.client_id,
    package_id: quote.package_id,
    vehicle_type: quote.vehicle_type,
    location_type: quote.location_type,
    status: 'scheduled',
    revenue: quote.subtotal,
    tip: 0,
    hours_worked: 0,
    notes: quote.notes ?? '',
  })

  const updated = await pb().collection('quotes').update(quoteId, {
    status: 'accepted',
    job_id: job.id,
  })

  return { quote: mapQuote(updated as Record<string, unknown>), jobId: String(job.id) }
}

export async function deleteQuote(id: string): Promise<boolean> {
  try {
    await pb().collection('quotes').delete(id)
    return true
  } catch {
    return false
  }
}

export async function getQuotesForClient(clientId: string): Promise<QuoteWithRelations[]> {
  const all = await listQuotes()
  return all.filter((q) => q.client_id === clientId)
}
