import { loadData, newId, saveData } from '../storage'
import { syncLeadForQuoteJob, syncLeadForQuoteSent } from './leads-local'
import type { Quote, QuoteInput, QuoteWithRelations } from '../types'

function nextQuoteNumber(): string {
  const data = loadData()
  const count = (data.quotes?.length ?? 0) + 1
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `QTE-${y}-${m}-${String(count).padStart(3, '0')}`
}

function enrich(quote: Quote): QuoteWithRelations {
  const data = loadData()
  return {
    ...quote,
    client: data.clients.find((c) => c.id === quote.client_id),
    package: data.packages.find((p) => p.id === quote.package_id),
  }
}

export function getQuotes(): QuoteWithRelations[] {
  const data = loadData()
  return (data.quotes ?? []).map(enrich).sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''))
}

export function getQuote(id: string): QuoteWithRelations | null {
  const q = loadData().quotes?.find((x) => x.id === id)
  return q ? enrich(q) : null
}

export function createQuote(input: QuoteInput): Quote {
  const data = loadData()
  const quote: Quote = {
    id: newId(),
    quote_number: nextQuoteNumber(),
    ...input,
    status: 'draft',
    created: new Date().toISOString(),
  }
  data.quotes = [...(data.quotes ?? []), quote]
  saveData(data)
  return quote
}

export function updateQuoteStatus(id: string, status: Quote['status']): Quote | null {
  const data = loadData()
  const idx = data.quotes?.findIndex((q) => q.id === id) ?? -1
  if (idx < 0 || !data.quotes) return null
  const current = data.quotes[idx]
  const updated: Quote = {
    ...current,
    status,
    sent_at: status === 'sent' ? new Date().toISOString().slice(0, 10) : current.sent_at,
  }
  data.quotes[idx] = updated
  saveData(data)
  if (status === 'sent') syncLeadForQuoteSent(id)
  return updated
}

export function acceptQuote(quoteId: string): { quote: Quote; jobId: string } | null {
  const data = loadData()
  const idx = data.quotes?.findIndex((q) => q.id === quoteId) ?? -1
  if (idx < 0 || !data.quotes) return null
  const quote = data.quotes[idx]
  if (quote.job_id) return { quote, jobId: quote.job_id }

  const job = {
    id: newId(),
    date: quote.date,
    client_id: quote.client_id,
    package_id: quote.package_id,
    vehicle_type: quote.vehicle_type,
    location_type: quote.location_type,
    status: 'scheduled' as const,
    revenue: quote.subtotal,
    tip: 0,
    hours_worked: 0,
    expenses: [],
    supplies_used: [],
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
    photo_count: 0,
    notes: quote.notes,
    created: new Date().toISOString(),
  }
  data.jobs.push(job)
  data.quotes[idx] = { ...quote, status: 'accepted', job_id: job.id }
  saveData(data)
  syncLeadForQuoteJob(quoteId, job.id)
  return { quote: data.quotes[idx], jobId: job.id }
}

export function deleteQuote(id: string): boolean {
  const data = loadData()
  const before = data.quotes?.length ?? 0
  data.quotes = (data.quotes ?? []).filter((q) => q.id !== id)
  if (data.quotes.length === before) return false
  saveData(data)
  return true
}
