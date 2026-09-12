import { describe, expect, it } from 'vitest'
import {
  formatDocumentDate,
  formatDocumentMoney,
  getDocumentStrings,
  locationDetailLabel,
  normalizeDocumentLocale,
  DOCUMENT_LOCALE_CODES,
} from './document-i18n'
import { invoiceStatusLabel } from './invoices'

describe('document-i18n', () => {
  it('normalizes locale', () => {
    expect(normalizeDocumentLocale('es')).toBe('es')
    expect(normalizeDocumentLocale('en')).toBe('en')
    expect(normalizeDocumentLocale('fr')).toBe('fr')
    expect(normalizeDocumentLocale('zh-CN')).toBe('zh')
    expect(normalizeDocumentLocale('xx')).toBe('en')
  })

  it('covers the most common world languages', () => {
    expect(DOCUMENT_LOCALE_CODES.length).toBeGreaterThanOrEqual(15)
    expect(DOCUMENT_LOCALE_CODES).toContain('zh')
    expect(DOCUMENT_LOCALE_CODES).toContain('hi')
    expect(DOCUMENT_LOCALE_CODES).toContain('ar')
  })

  it('returns Spanish invoice labels', () => {
    expect(getDocumentStrings('es').invoice).toBe('Factura')
    expect(getDocumentStrings('es').estimate).toBe('Cotización')
    expect(invoiceStatusLabel('paid', 'es')).toBe('PAGADO')
    expect(invoiceStatusLabel('sent', 'es')).toBe('ENVIADO')
    expect(locationDetailLabel('mobile', 'es')).toBe('Detalle a domicilio')
  })

  it('returns catalogs for each supported locale', () => {
    for (const code of DOCUMENT_LOCALE_CODES) {
      const s = getDocumentStrings(code)
      expect(s.invoice.length).toBeGreaterThan(0)
      expect(s.andConjunction.length).toBeGreaterThan(0)
    }
  })

  it('formats money and dates for es-US', () => {
    expect(formatDocumentMoney(150, 'es')).toMatch(/150/)
    expect(formatDocumentDate('2026-07-12', 'es')).toMatch(/2026/)
  })
})
