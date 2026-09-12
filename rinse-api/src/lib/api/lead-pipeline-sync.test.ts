import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  syncLeadForQuoteJob,
  syncLeadForQuoteSent,
  createLead,
  createQuoteForLead,
  convertLeadToJob,
  updateLead,
  getLead,
} from './leads-local'
import { newId, saveData, createSeedData } from '../storage'
import { leadStageLabel, toClientLeadSource } from '../lead-sources'

function createStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('leadStageLabel', () => {
  it('labels booked stage as Scheduled', () => {
    expect(leadStageLabel('booked')).toBe('Scheduled')
  })
})

describe('toClientLeadSource', () => {
  it('passes through sources valid on clients.lead_source', () => {
    expect(toClientLeadSource('google')).toBe('google')
    expect(toClientLeadSource('referral')).toBe('referral')
  })

  it('maps lead-only sources so PocketBase create does not 400', () => {
    expect(toClientLeadSource('text')).toBe('other')
    expect(toClientLeadSource('website')).toBe('other')
  })

  it('returns undefined for empty source', () => {
    expect(toClientLeadSource(undefined)).toBeUndefined()
    expect(toClientLeadSource('')).toBeUndefined()
  })
})

describe('syncLeadForQuoteJob', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('window', {} as Window)
    saveData(createSeedData())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('links pipeline lead when quote becomes a job', () => {
    const quoteId = newId()
    const jobId = newId()

    const lead = createLead({
      name: 'Jordan P.',
      source: 'referral',
      vehicle_type: 'suv',
      stage: 'quoted',
    })

    updateLead(lead.id, { quote_id: quoteId })

    syncLeadForQuoteJob(quoteId, jobId)

    const updated = getLead(lead.id)
    expect(updated?.job_id).toBe(jobId)
    expect(updated?.stage).toBe('booked')
  })
})

describe('pipeline stage advances', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('window', {} as Window)
    saveData(createSeedData())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('moves inquiry to quoted when a quote is created', () => {
    const pkgId = createSeedData().packages[0]?.id
    expect(pkgId).toBeTruthy()

    const lead = createLead({
      name: 'Alex M.',
      source: 'website',
      vehicle_type: 'suv',
      package_id: pkgId,
      quote_amount: 320,
      stage: 'inquiry',
    })

    createQuoteForLead(lead.id)

    const updated = getLead(lead.id)
    expect(updated?.stage).toBe('quoted')
    expect(updated?.quote_id).toBeTruthy()
  })

  it('moves quoted to booked (scheduled) when a job is created', () => {
    const pkgId = createSeedData().packages[0]?.id
    const lead = createLead({
      name: 'Alex M.',
      source: 'website',
      vehicle_type: 'suv',
      package_id: pkgId,
      quote_amount: 320,
      stage: 'quoted',
    })

    const { jobId } = convertLeadToJob(lead.id, { date: '2026-07-10', start_time: '10:00' })

    const updated = getLead(lead.id)
    expect(updated?.stage).toBe('booked')
    expect(updated?.job_id).toBe(jobId)
  })

  it('promotes inquiry to quoted when the linked quote is marked sent', () => {
    const quoteId = newId()
    const lead = createLead({
      name: 'Alex M.',
      source: 'website',
      vehicle_type: 'suv',
      stage: 'inquiry',
    })
    updateLead(lead.id, { quote_id: quoteId })

    syncLeadForQuoteSent(quoteId)

    expect(getLead(lead.id)?.stage).toBe('quoted')
  })
})
