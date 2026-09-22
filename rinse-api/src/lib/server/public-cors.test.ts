import { afterEach, describe, expect, it } from 'vitest'
import { jsonWithCors, publicCorsHeaders } from './public-cors'

describe('public-cors', () => {
  afterEach(() => {
    delete process.env.BOOKING_ALLOWED_ORIGINS
  })

  it('allows localhost default origins when none specified', () => {
    const req = new Request('https://api.rinsehq.com/api/public/test/business', {
      headers: { origin: 'http://localhost:3001' },
    })
    const headers = publicCorsHeaders(req) as Record<string, string>
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3001')
  })

  it('allows tenant-specific origin', () => {
    const req = new Request('https://api.rinsehq.com/api/public/apex/business', {
      headers: { origin: 'https://apexdetail.com' },
    })
    const headers = publicCorsHeaders(req, ['https://apexdetail.com']) as Record<string, string>
    expect(headers['Access-Control-Allow-Origin']).toBe('https://apexdetail.com')
    expect(headers.Vary).toBe('Origin')
  })

  it('does not allow arbitrary origin not listed in tenant origins or env', () => {
    const req = new Request('https://api.rinsehq.com/api/public/apex/business', {
      headers: { origin: 'https://malicious-site.com' },
    })
    const headers = publicCorsHeaders(req, ['https://apexdetail.com']) as Record<string, string>
    expect(headers['Access-Control-Allow-Origin']).not.toBe('https://malicious-site.com')
  })

  it('merges env origins and tenant origins in jsonWithCors', async () => {
    process.env.BOOKING_ALLOWED_ORIGINS = 'https://custom-marketing.org'
    const req = new Request('https://api.rinsehq.com/api/public/apex/business', {
      headers: { origin: 'https://custom-marketing.org' },
    })
    const res = jsonWithCors(req, { ok: true }, 200, ['https://tenant-site.com'])
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://custom-marketing.org')
  })
})
