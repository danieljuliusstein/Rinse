import { describe, expect, it } from 'vitest'
import { formatPortalDate, portalBalancePanelClass, portalInvoiceBadgeClass } from './portal-display'

describe('portalBalancePanelClass', () => {
  it('hides panel when balance is zero', () => {
    expect(portalBalancePanelClass('sent', 0)).toBeNull()
    expect(portalBalancePanelClass('overdue', 0)).toBeNull()
  })

  it('uses danger for overdue with balance', () => {
    expect(portalBalancePanelClass('overdue', 50)).toBe('danger')
  })

  it('uses warning for non-overdue with balance', () => {
    expect(portalBalancePanelClass('sent', 50)).toBe('warning')
    expect(portalBalancePanelClass('partial', 25)).toBe('warning')
  })
})

describe('formatPortalDate', () => {
  it('returns em dash for empty or invalid dates', () => {
    expect(formatPortalDate('')).toBe('—')
    expect(formatPortalDate('invalid')).toBe('—')
  })

  it('formats valid ISO dates', () => {
    expect(formatPortalDate('2026-06-06')).toBe('June 6, 2026')
  })
})

describe('portalInvoiceBadgeClass', () => {
  it('maps known statuses', () => {
    expect(portalInvoiceBadgeClass('paid')).toContain('portal-badge--paid')
    expect(portalInvoiceBadgeClass('overdue')).toContain('portal-badge--overdue')
  })
})
