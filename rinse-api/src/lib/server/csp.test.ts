import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { buildContentSecurityPolicyReportOnly, embedFrameAncestors } from './csp'

describe('buildContentSecurityPolicyReportOnly', () => {
  // csp.ts resolves `PB_URL ?? NEXT_PUBLIC_PB_URL` — PB_URL must be stubbed
  // too, or CI's placeholder PB_URL (set at the job level) silently wins.
  const prevPbUrl = process.env.PB_URL
  const prevPublicPb = process.env.NEXT_PUBLIC_PB_URL

  beforeAll(() => {
    process.env.PB_URL = 'https://detailing-pb.fly.dev'
    process.env.NEXT_PUBLIC_PB_URL = 'https://detailing-pb.fly.dev'
  })

  afterEach(() => {
    delete process.env.BOOKING_ALLOWED_ORIGINS
  })

  afterAll(() => {
    if (prevPbUrl === undefined) delete process.env.PB_URL
    else process.env.PB_URL = prevPbUrl
    if (prevPublicPb === undefined) delete process.env.NEXT_PUBLIC_PB_URL
    else process.env.NEXT_PUBLIC_PB_URL = prevPublicPb
  })

  it('uses self frame-ancestors on operator routes', () => {
    const csp = buildContentSecurityPolicyReportOnly('/jobs')
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).not.toContain('frame-ancestors *')
  })

  it('allows configured origins in frame-ancestors on book routes', () => {
    process.env.BOOKING_ALLOWED_ORIGINS = 'https://rinsehq.com,https://customer.example.com'
    const csp = buildContentSecurityPolicyReportOnly('/book/atlas-detailing')
    expect(csp).toContain("frame-ancestors 'self' https://rinsehq.com https://customer.example.com")
  })

  it('includes report-uri and Stripe connect hosts', () => {
    const csp = buildContentSecurityPolicyReportOnly('/portal/abc')
    expect(csp).toContain('report-uri /api/csp-report')
    expect(csp).toContain('https://api.stripe.com')
    expect(csp).toContain('https://detailing-pb.fly.dev')
  })

  it('applies embed frame-ancestors on /embed paths', () => {
    process.env.BOOKING_ALLOWED_ORIGINS = 'https://marketing.test'
    const csp = buildContentSecurityPolicyReportOnly('/embed/book/slug')
    expect(csp).toContain('frame-ancestors')
    expect(csp).toContain('https://marketing.test')
  })

  it('includes tenant-specific origins in frame-ancestors', () => {
    const csp = buildContentSecurityPolicyReportOnly('/embed/book/apex-detail', [
      'https://apexdetailing.com',
      'https://www.apexdetailing.com',
    ])
    expect(csp).toContain(
      "frame-ancestors 'self' https://apexdetailing.com https://www.apexdetailing.com",
    )
  })
})

describe('embedFrameAncestors', () => {
  afterEach(() => {
    delete process.env.BOOKING_ALLOWED_ORIGINS
  })

  it('defaults to self only', () => {
    expect(embedFrameAncestors()).toBe("'self'")
  })

  it('merges env origins and tenant origins without duplicates', () => {
    process.env.BOOKING_ALLOWED_ORIGINS = 'https://shared.com,https://duplicate.com'
    const res = embedFrameAncestors(['https://duplicate.com', 'https://tenant.com'])
    expect(res).toBe("'self' https://shared.com https://duplicate.com https://tenant.com")
  })
})
