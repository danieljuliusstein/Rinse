import { getPocketBase } from '../pocketbase'
import { pbQuoteToApp, pbQuoteToAppWithRelations, escapeFilterValue, type PbRecord } from './mappers'
import { syncLeadForQuoteJob } from './leads-pocketbase'
import { rethrowPremiumPocketBaseError } from '../premium-api'
import { withOrganization } from './tenant-pocketbase'
import type { Quote, QuoteInput, QuoteWithRelations } from '../types'

const QUOTE_EXPAND = 'client_id,package_id'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

export async function getQuotes(): Promise<QuoteWithRelations[]> {
  const records = await pb().collection('quotes').getFullList<PbRecord>({
    sort: '-id',
    expand: QUOTE_EXPAND,
  })
  return records.map(pbQuoteToAppWithRelations)
}

export async function getQuote(id: string): Promise<QuoteWithRelations | null> {
  try {
    const record = await pb().collection('quotes').getOne<PbRecord>(id, { expand: QUOTE_EXPAND })
    return pbQuoteToAppWithRelations(record)
  } catch {
    return null
  }
}

export async function createQuote(input: QuoteInput): Promise<Quote> {
  try {
    const created = await pb().collection('quotes').create<PbRecord>(
      withOrganization({
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
      }),
    )
    return pbQuoteToApp(created)
  } catch (err) {
    rethrowPremiumPocketBaseError(err)
  }
}

export async function updateQuoteStatus(id: string, status: Quote['status']): Promise<Quote | null> {
  try {
    const payload: Record<string, unknown> = { status }
    if (status === 'sent') payload.sent_at = new Date().toISOString().slice(0, 10)
    const updated = await pb().collection('quotes').update<PbRecord>(id, payload)
    return pbQuoteToApp(updated)
  } catch {
    return null
  }
}

export async function acceptQuote(quoteId: string): Promise<{ quote: Quote; jobId: string } | null> {
  const quote = await getQuote(quoteId)
  if (!quote) return null
  if (quote.job_id) return { quote, jobId: quote.job_id }
  if (quote.status === 'declined' || quote.status === 'expired') return null

  const job = await pb().collection('jobs').create<PbRecord>(
    withOrganization({
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
    }),
  )

  const updated = await pb().collection('quotes').update<PbRecord>(quoteId, {
    status: 'accepted',
    job_id: job.id,
  })

  await syncLeadForQuoteJob(quoteId, job.id)

  return { quote: pbQuoteToApp(updated), jobId: job.id }
}

export async function deleteQuote(id: string): Promise<boolean> {
  try {
    await pb().collection('quotes').delete(id)
    return true
  } catch {
    return false
  }
}
