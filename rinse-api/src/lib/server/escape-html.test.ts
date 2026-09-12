import { describe, expect, it } from 'vitest'
import { escapeHtml, validatePortalEmailHref } from './escape-html'

describe('escapeHtml', () => {
  it('escapes script tags', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })

  it('escapes quotes', () => {
    expect(escapeHtml(`"onclick='x'"`)).toBe('&quot;onclick=&#39;x&#39;&quot;')
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('Smith & Sons')).toBe('Smith &amp; Sons')
    expect(escapeHtml('a & b & c')).toBe('a &amp; b &amp; c')
  })
})

describe('validatePortalEmailHref', () => {
  const token = 'abcdefghijklmnopqrstuvwxyz012345'
  const allowed = ['https://app.rinsehq.com']

  it('accepts valid portal URLs on allowed origins', () => {
    expect(
      validatePortalEmailHref(`https://app.rinsehq.com/portal/${token}`, allowed),
    ).toBe(`https://app.rinsehq.com/portal/${token}`)
  })

  it('rejects javascript URLs', () => {
    expect(validatePortalEmailHref('javascript:alert(1)', allowed)).toBeNull()
  })

  it('rejects off-origin URLs', () => {
    expect(
      validatePortalEmailHref(`https://evil.com/portal/${token}`, allowed),
    ).toBeNull()
  })
})
