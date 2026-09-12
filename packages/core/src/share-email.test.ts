import { describe, expect, it } from 'vitest'
import { formatShareEmailBody, getShareEmailCopy } from './share-email'

describe('share-email', () => {
  it('returns English invoice copy by default', () => {
    const copy = getShareEmailCopy('invoice', 'en')
    expect(copy.subject({ businessName: 'Rinse', invoiceNumber: 'INV-1' })).toContain('Invoice')
    expect(copy.bodyIntro.toLowerCase()).toContain('pay')
  })

  it('returns Spanish invoice copy', () => {
    const copy = getShareEmailCopy('invoice', 'es')
    expect(copy.subject({ businessName: 'Rinse', invoiceNumber: 'INV-1' })).toMatch(/Factura|factura/i)
    expect(copy.bodyIntro.toLowerCase()).toContain('enlace')
  })

  it('falls back to English for unsupported locales', () => {
    const copy = getShareEmailCopy('photos', 'ja')
    expect(copy.subject({ businessName: 'Rinse' })).toContain('photos')
  })

  it('formats body with link', () => {
    expect(formatShareEmailBody('Hello', 'https://x.test')).toBe('Hello\n\nhttps://x.test')
  })
})
