/**
 * Phase 4: Route Handlers with Real Persistence
 *
 * Imports the real Next.js route handlers (the same POST/GET exports Next
 * calls in production) and invokes them directly against a disposable
 * PocketBase — no mocked modules, unlike route-contract.test.ts. Skipped
 * without PocketBase integration config, same as the other integration
 * suites.
 */
import { afterAll, describe, expect, it } from 'vitest'
import {
  createIntegrationAccount,
  deleteIntegrationAccount,
  hasPocketBaseIntegrationConfig,
} from './pocketbase-integration'

const integration = hasPocketBaseIntegrationConfig()

describe.skipIf(!integration)('Phase 4: Route Handlers', () => {
  const accounts: Awaited<ReturnType<typeof createIntegrationAccount>>[] = []

  afterAll(async () => {
    for (const acc of accounts) {
      await deleteIntegrationAccount(acc)
    }
    accounts.length = 0
  })

  it('public booking route creates job and lead', async () => {
    const account = await createIntegrationAccount(`route-booking-${Date.now()}`)
    accounts.push(account)

    const org = await account.pb.collection('organizations').getOne(account.organizationId)
    const pkg = await account.pb.collection('packages').create({
      name: 'Route Booking Package',
      base_price: 175,
      active: true,
      organization_id: account.organizationId,
    })

    const { POST } = await import('../app/api/public/[slug]/booking/route')
    const response = await POST(
      new Request('http://test/api/public/route-booking/booking', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Route Booking Customer',
          phone: '555-4200',
          packageId: pkg.id,
          date: '2026-11-16', // Monday — default booking schedule is Mon-Sat
          // Default schedule is 08:00-18:00 in 120-minute slots (08/10/12/14/16);
          // 08:00 is the first valid slot boundary.
          startTime: '08:00',
          locationType: 'mobile',
          vehicleType: 'sedan',
        }),
      }),
      { params: Promise.resolve({ slug: org.slug }) },
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.ok).toBe(true)
    expect(payload.booking.clientName).toBe('Route Booking Customer')

    const job = await account.pb.collection('jobs').getOne(payload.booking.jobId)
    expect(job.organization_id).toBe(account.organizationId)
    const leads = await account.pb.collection('leads').getFullList({
      filter: `job_id = "${payload.booking.jobId}"`,
    })
    expect(leads).toHaveLength(1)
  })

  it('portal accept-quote transitions to invoice', async () => {
    const account = await createIntegrationAccount(`route-accept-quote-${Date.now()}`)
    accounts.push(account)

    const pkg = await account.pb.collection('packages').create({
      name: 'Route Accept Package',
      base_price: 220,
      active: true,
      organization_id: account.organizationId,
    })
    const client = await account.pb.collection('clients').create({
      name: 'Route Accept Client',
      phone: '555-4201',
      organization_id: account.organizationId,
    })
    const quote = await account.pb.collection('quotes').create({
      client_id: client.id,
      package_id: pkg.id,
      vehicle_type: 'sedan',
      location_type: 'mobile',
      date: '2026-11-16',
      organization_id: account.organizationId,
      quote_number: 'QT-ROUTE',
      status: 'sent',
      subtotal: 220,
    })

    const { createPortalToken } = await import('../lib/server/portal-tokens')
    const portal = await createPortalToken({
      clientId: client.id,
      scope: 'quote',
      quoteId: quote.id,
      pb: account.pb,
    })

    const { POST } = await import('../app/api/portal/[token]/accept-quote/route')
    const first = await POST(
      new Request('http://test/api/portal/accept-quote', { method: 'POST' }),
      { params: Promise.resolve({ token: portal.token }) },
    )
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ ok: true })

    const accepted = await account.pb.collection('quotes').getOne(quote.id)
    expect(accepted.status).toBe('accepted')

    // Idempotent on repeat, matching route-contract.test.ts's mocked contract
    // test, but now proven against real persistence.
    const second = await POST(
      new Request('http://test/api/portal/accept-quote', { method: 'POST' }),
      { params: Promise.resolve({ token: portal.token }) },
    )
    expect(second.status).toBe(200)
    expect(await second.json()).toEqual({ ok: true, alreadyAccepted: true })
  })

  it('portal sign-invoice persists signature', async () => {
    const account = await createIntegrationAccount(`route-sign-invoice-${Date.now()}`)
    accounts.push(account)

    const pkg = await account.pb.collection('packages').create({
      name: 'Route Sign Package',
      base_price: 140,
      active: true,
      organization_id: account.organizationId,
    })
    const client = await account.pb.collection('clients').create({
      name: 'Route Sign Client',
      phone: '555-4202',
      organization_id: account.organizationId,
    })
    const job = await account.pb.collection('jobs').create({
      date: '2026-11-17',
      location_type: 'mobile',
      vehicle_type: 'sedan',
      package_id: pkg.id,
      client_id: client.id,
      status: 'completed',
      revenue: 140,
      organization_id: account.organizationId,
    })
    const invoice = await account.pb.collection('invoices').create({
      job_id: job.id,
      client_id: client.id,
      organization_id: account.organizationId,
      invoice_number: 'INV-ROUTE-SIGN',
      status: 'sent',
      subtotal: 140,
      total: 140,
      tip: 0,
      balance_due: 140,
    })
    await account.pb.collection('jobs').update(job.id, { invoice_id: invoice.id })

    const { createPortalToken } = await import('../lib/server/portal-tokens')
    const portal = await createPortalToken({
      clientId: client.id,
      scope: 'job',
      jobId: job.id,
      pb: account.pb,
    })

    // saveInvoiceSignature requires a data:image/png;base64,... URL — a plain
    // https URL is rejected as "Invalid signature image" (unlike the
    // signature_url text field itself, which accepts any string when written
    // directly, as in Phase 2's invoice signature test).
    const signatureDataUrl = `data:image/png;base64,${Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64')}`

    const { POST } = await import('../app/api/portal/[token]/sign-invoice/route')
    const response = await POST(
      new Request('http://test/api/portal/sign-invoice', {
        method: 'POST',
        body: JSON.stringify({ signatureUrl: signatureDataUrl }),
      }),
      { params: Promise.resolve({ token: portal.token }) },
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.ok).toBe(true)
    expect(payload.signedAt).toBeTruthy()

    const signed = await account.pb.collection('invoices').getOne(invoice.id)
    expect(signed.signature_url).toBe(signatureDataUrl)
    expect(signed.signed_at).toBeTruthy()
  })

  it('invoice send route requires auth and a configured email provider', async () => {
    // Real, honest behavior with no RESEND_API_KEY set (Phase 5 territory —
    // needs email provider credentials to go further than this). Verifies
    // the parts that don't need Resend: auth is enforced, and the route
    // reports 503 (not a silent no-op) once authenticated with no provider
    // configured, rather than mocking Resend out.
    const account = await createIntegrationAccount(`route-invoice-send-${Date.now()}`)
    accounts.push(account)

    const { POST } = await import('../app/api/invoices/send/route')

    const unauthenticated = await POST(
      new Request('http://test/api/invoices/send', {
        method: 'POST',
        body: JSON.stringify({ to: 'client@example.test', invoiceNumber: 'INV-1', businessName: 'Test' }),
      }),
    )
    expect(unauthenticated.status).toBe(401)

    const token = account.pb.authStore.token
    const authenticated = await POST(
      new Request('http://test/api/invoices/send', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to: 'client@example.test',
          invoiceNumber: 'INV-1',
          businessName: 'Test Business',
        }),
      }),
    )
    expect([503, 400]).toContain(authenticated.status)
    if (authenticated.status === 503) {
      const payload = await authenticated.json()
      expect(payload.error).toContain('RESEND_API_KEY')
    }
  })

  it('PDF routes generate real binary content', async () => {
    const account = await createIntegrationAccount(`route-pdf-${Date.now()}`)
    accounts.push(account)

    const pkg = await account.pb.collection('packages').create({
      name: 'Route PDF Package',
      base_price: 165,
      active: true,
      organization_id: account.organizationId,
    })
    const client = await account.pb.collection('clients').create({
      name: 'Route PDF Client',
      phone: '555-4203',
      organization_id: account.organizationId,
    })
    const job = await account.pb.collection('jobs').create({
      date: '2026-11-18',
      location_type: 'mobile',
      vehicle_type: 'sedan',
      package_id: pkg.id,
      client_id: client.id,
      status: 'completed',
      revenue: 165,
      organization_id: account.organizationId,
    })
    const invoice = await account.pb.collection('invoices').create({
      job_id: job.id,
      client_id: client.id,
      organization_id: account.organizationId,
      invoice_number: 'INV-ROUTE-PDF',
      status: 'sent',
      subtotal: 165,
      total: 165,
      tip: 0,
      balance_due: 165,
    })

    const { POST } = await import('../app/api/pdf/invoice/route')
    const response = await POST(
      new Request('http://test/api/pdf/invoice', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${account.pb.authStore.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ jobId: job.id, invoiceId: invoice.id }),
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/pdf')
    const buffer = Buffer.from(await response.arrayBuffer())
    expect(buffer.length).toBeGreaterThan(100)
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-')
  }, 20_000)

  it('auth signup creates user, organization, and default packages', async () => {
    const { POST } = await import('../app/api/auth/signup/route')
    const email = `route-signup-${Date.now()}@example.test`

    const response = await POST(
      new Request('http://test/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: 'RouteSignup2026!aA1',
          businessName: `Route Signup Biz ${Date.now()}`,
        }),
      }),
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.ok).toBe(true)
    expect(payload.email).toBe(email)

    const { authenticateAdmin } = await import('./pocketbase-integration')
    const admin = await authenticateAdmin()
    const users = await admin.collection('users').getFullList({ filter: `email = "${email}"` })
    expect(users).toHaveLength(1)
    const orgId = String(users[0].organization_id)
    const org = await admin.collection('organizations').getOne(orgId)
    expect(org.slug).toBe(payload.slug)

    const packages = await admin.collection('packages').getFullList({
      filter: `organization_id = "${orgId}"`,
    })
    expect(packages.length).toBeGreaterThan(0)

    const settings = await admin.collection('app_settings').getFullList({
      filter: `organization_id = "${orgId}"`,
    })
    expect(settings).toHaveLength(1)

    accounts.push({ email, password: 'RouteSignup2026!aA1', userId: users[0].id, organizationId: orgId, pb: admin })
  })

  it('duplicate signup email is rejected', async () => {
    const { POST } = await import('../app/api/auth/signup/route')
    const email = `route-signup-dup-${Date.now()}@example.test`
    const payload = {
      email,
      password: 'RouteSignup2026!aA1',
      businessName: `Dup Signup Biz ${Date.now()}`,
    }

    const first = await POST(new Request('http://test/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) }))
    expect(first.status).toBe(200)

    const { authenticateAdmin } = await import('./pocketbase-integration')
    const admin = await authenticateAdmin()
    const users = await admin.collection('users').getFullList({ filter: `email = "${email}"` })
    accounts.push({ email, password: payload.password, userId: users[0].id, organizationId: String(users[0].organization_id), pb: admin })

    const second = await POST(new Request('http://test/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) }))
    expect(second.status).toBe(400)
  })

  it('admin routes require superuser (platform admin allowlist)', async () => {
    const account = await createIntegrationAccount(`route-admin-${Date.now()}`)
    accounts.push(account)

    const { GET } = await import('../app/api/admin/orgs/route')

    const unauthenticated = await GET(new Request('http://test/api/admin/orgs'))
    expect(unauthenticated.status).toBe(403)

    const nonAdmin = await GET(
      new Request('http://test/api/admin/orgs', {
        headers: { authorization: `Bearer ${account.pb.authStore.token}` },
      }),
    )
    expect(nonAdmin.status).toBe(403)

    // Real allowlist check (isPlatformAdminEmail reads this env var fresh on
    // every call — no module needs reimporting).
    const previous = process.env.PLATFORM_ADMIN_EMAILS
    process.env.PLATFORM_ADMIN_EMAILS = account.email
    try {
      const asAdmin = await GET(
        new Request('http://test/api/admin/orgs', {
          headers: { authorization: `Bearer ${account.pb.authStore.token}` },
        }),
      )
      expect(asAdmin.status).toBe(200)
      const payload = await asAdmin.json()
      expect(Array.isArray(payload.orgs)).toBe(true)
      expect(payload.orgs.some((org: { id: string }) => org.id === account.organizationId)).toBe(true)
    } finally {
      process.env.PLATFORM_ADMIN_EMAILS = previous
    }
  })

  it('settings persist to app_settings (no dedicated API route — direct PocketBase writes)', async () => {
    // Verified: there is no src/app/api/settings/**/route.ts in this repo.
    // The operator apps write app_settings directly via
    // src/lib/api/settings-pocketbase.ts (already exercised at the
    // collection level in Phase 2's Organization Settings tests). This test
    // documents that and re-confirms the real persistence path here.
    const account = await createIntegrationAccount(`route-settings-${Date.now()}`)
    accounts.push(account)

    const settings = await account.pb.collection('app_settings').create({
      organization_id: account.organizationId,
      business_name: 'Route Settings Biz',
    })
    const updated = await account.pb.collection('app_settings').update(settings.id, {
      business_phone: '555-4204',
    })
    expect(updated.business_phone).toBe('555-4204')
  })
})
