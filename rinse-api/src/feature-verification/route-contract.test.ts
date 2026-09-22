import { describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  organizations: [{ id: 'org-1', slug: 'rinse-test' }],
  bookings: [] as Record<string, unknown>[],
  quotes: new Map([['quote-1', { id: 'quote-1', status: 'sent' }]]),
  signatures: [] as Record<string, unknown>[],
  portal: { token: 'valid-token-123456789', scope: 'quote', quote_id: 'quote-1' } as Record<string, unknown>,
}))

vi.mock('@/lib/server/organization', () => ({
  getOrganizationBySlug: vi.fn(async (slug: string) => state.organizations.find((org) => org.slug === slug) ?? null),
}))
vi.mock('@/lib/server/rate-limit', () => ({
  RATE_LIMITS: { publicBookingIp: 100, publicBookingPhone: 100 },
  enforceRateLimit: vi.fn(async () => null),
}))
vi.mock('@/lib/server/client-ip', () => ({ getClientIp: vi.fn(() => '127.0.0.1') }))
vi.mock('@/lib/server/request-body', () => ({ rejectOversizedBody: vi.fn(() => null) }))
vi.mock('@/lib/server/public-cors', () => ({
  jsonWithCors: (_request: Request, body: unknown, status = 200) => Response.json(body, { status }),
  publicCorsHeaders: () => ({}),
}))
vi.mock('@/lib/server/booking-public', () => ({
  createPublicBookingForOrg: vi.fn(async (organizationId: string, input: Record<string, unknown>) => {
    const booking = { id: `booking-${state.bookings.length + 1}`, organization_id: organizationId, ...input }
    state.bookings.push(booking)
    return booking
  }),
}))
vi.mock('@/lib/server/portal-tokens', () => ({
  validatePortalToken: vi.fn(async (token: string) => token === state.portal.token ? state.portal : null),
}))
vi.mock('@/lib/server/pocketbase-admin', () => ({
  authenticateServerAdmin: vi.fn(async () => ({
    collection: (name: string) => ({
      getOne: async (id: string) => {
        if (name === 'quotes') return state.quotes.get(id)
        throw new Error(`Missing ${name}:${id}`)
      },
      update: async (id: string, patch: Record<string, unknown>) => {
        const value = { ...(state.quotes.get(id) ?? {}), ...patch }
        state.quotes.set(id, value)
        return value
      },
    }),
  })),
}))
vi.mock('@/lib/server/invoice-signature', () => ({
  saveInvoiceSignature: vi.fn(async (invoiceId: string, signatureUrl: string) => {
    const signedAt = '2026-09-21T00:00:00.000Z'
    state.signatures.push({ invoiceId, signatureUrl, signedAt })
    return { signedAt }
  }),
}))

describe('core route contracts', () => {
  it('rejects invalid public booking input without persistence', async () => {
    const { POST } = await import('@/app/api/public/[slug]/booking/route')
    const response = await POST(
      new Request('http://test/book', { method: 'POST', body: JSON.stringify({ name: '', phone: '' }) }),
      { params: Promise.resolve({ slug: 'rinse-test' }) },
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Name and phone are required' })
    expect(state.bookings).toHaveLength(0)
  })

  it('persists a valid public booking with organization context', async () => {
    const { POST } = await import('@/app/api/public/[slug]/booking/route')
    const response = await POST(
      new Request('http://test/book', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Customer', phone: '555-1234', packageId: 'pkg-1', date: '2026-10-01' }),
      }),
      { params: Promise.resolve({ slug: 'rinse-test' }) },
    )
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.booking.organization_id).toBe('org-1')
    expect(state.bookings).toHaveLength(1)
  })

  it('accepts a quote once and returns an idempotent response on repeat', async () => {
    const { POST } = await import('@/app/api/portal/[token]/accept-quote/route')
    const request = new Request('http://test/portal/valid-token-123456789/accept', { method: 'POST' })
    const first = await POST(request, { params: Promise.resolve({ token: state.portal.token }) })
    const second = await POST(request, { params: Promise.resolve({ token: state.portal.token }) })
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ ok: true })
    expect(second.status).toBe(200)
    expect(await second.json()).toEqual({ ok: true, alreadyAccepted: true })
    expect(state.quotes.get('quote-1')?.status).toBe('accepted')
  })

  it('rejects an invalid signature payload before any persistence call', async () => {
    state.portal = { token: 'valid-invoice-token-123456', scope: 'invoice', job_id: 'job-1' }
    const { POST } = await import('@/app/api/portal/[token]/sign-invoice/route')
    const response = await POST(
      new Request('http://test/sign', { method: 'POST', body: JSON.stringify({ signatureUrl: '' }) }),
      { params: Promise.resolve({ token: state.portal.token as string }) },
    )
    expect(response.status).toBe(400)
    expect(state.signatures).toHaveLength(0)
  })
})
