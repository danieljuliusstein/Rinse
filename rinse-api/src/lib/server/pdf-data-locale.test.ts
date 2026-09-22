import { describe, expect, it, vi } from 'vitest'
import type PocketBase from 'pocketbase'
import { fetchInvoicePdfData, fetchQuotePdfData } from './pdf-data'

function client(locale: unknown, hasSettings = true): PocketBase {
  const records: Record<string, Record<string, unknown>> = {
    jobs: { id: 'job', organization_id: 'org', date: '2026-09-22', revenue: 100 },
    invoices: { id: 'invoice', organization_id: 'org', job_id: 'job', total: 100 },
    quotes: { id: 'quote', organization_id: 'org', subtotal: 100, date: '2026-09-22' },
    organizations: { id: 'org', slug: 'example' },
  }
  return {
    collection: vi.fn((name: string) => ({
      getOne: vi.fn(async () => records[name]),
      getFullList: vi.fn(async () => hasSettings ? [{ id: 'settings', document_locale: locale }] : []),
    })),
  } as unknown as PocketBase
}

describe('PDF document language', () => {
  it.each([
    ['es', 'es'],
    ['zh-CN', 'zh'],
    ['unsupported', 'en'],
    [undefined, 'en'],
  ])('preserves or normalizes %s for invoice and quote data', async (stored, expected) => {
    const pb = client(stored)
    expect((await fetchInvoicePdfData(pb, 'org', 'job', 'invoice')).settings.document_locale).toBe(expected)
    expect((await fetchQuotePdfData(pb, 'org', 'quote')).settings.document_locale).toBe(expected)
  })

  it('defaults both documents to English without a settings row', async () => {
    const pb = client(undefined, false)
    expect((await fetchInvoicePdfData(pb, 'org', 'job', 'invoice')).settings.document_locale).toBe('en')
    expect((await fetchQuotePdfData(pb, 'org', 'quote')).settings.document_locale).toBe('en')
  })
})
