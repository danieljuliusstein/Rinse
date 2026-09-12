import { describe, expect, it } from 'vitest'
import {
  businessLogoApiUrl,
  DEFAULT_BUSINESS_LOGO_PATH,
  hasCustomBusinessLogo,
  pocketBaseRecordHasLogo,
  resolveBusinessLogoSrc,
} from './business-logo'

describe('business-logo', () => {
  it('treats default path and empty as no custom logo', () => {
    expect(hasCustomBusinessLogo(undefined)).toBe(false)
    expect(hasCustomBusinessLogo('')).toBe(false)
    expect(hasCustomBusinessLogo(DEFAULT_BUSINESS_LOGO_PATH)).toBe(false)
  })

  it('detects uploaded logo API URLs', () => {
    expect(hasCustomBusinessLogo('/api/business-logo?slug=atlas')).toBe(true)
  })

  it('resolveBusinessLogoSrc returns undefined without custom logo', () => {
    expect(resolveBusinessLogoSrc('/logo.png')).toBeUndefined()
    expect(resolveBusinessLogoSrc('/api/business-logo?slug=x')).toBe('/api/business-logo?slug=x')
  })

  it('businessLogoApiUrl adds cache-bust query param', () => {
    expect(businessLogoApiUrl('atlas-detailing')).toBe('/api/business-logo?slug=atlas-detailing')
    expect(businessLogoApiUrl('atlas-detailing', '2024-01-01')).toBe(
      '/api/business-logo?slug=atlas-detailing&v=2024-01-01',
    )
  })

  it('pocketBaseRecordHasLogo accepts string or array file fields', () => {
    expect(pocketBaseRecordHasLogo('logo_abc.png')).toBe(true)
    expect(pocketBaseRecordHasLogo(['logo_abc.png'])).toBe(true)
    expect(pocketBaseRecordHasLogo('')).toBe(false)
    expect(pocketBaseRecordHasLogo([])).toBe(false)
    expect(pocketBaseRecordHasLogo(null)).toBe(false)
  })
})
