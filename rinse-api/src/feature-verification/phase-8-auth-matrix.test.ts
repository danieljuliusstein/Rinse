/**
 * Phase 8: Complete Authorization Matrix
 *
 * Phase 3 already covers per-collection cross-tenant denial exhaustively,
 * and Phase 4 already covers auth on individual routes. This phase fills
 * the gaps those didn't: a route-level sweep across permission levels,
 * a genuinely unprovisioned (organization-less) user, cross-org denial at
 * the route layer (not just the collection layer), and list-rule filtering
 * for the two collections Phase 3 didn't check at the list level.
 */
import { afterAll, describe, expect, it } from 'vitest'
import {
  createIntegrationAccount,
  createUnprovisionedUser,
  deleteIntegrationAccount,
  hasPocketBaseIntegrationConfig,
} from './pocketbase-integration'

const integration = hasPocketBaseIntegrationConfig()

describe.skipIf(!integration)('Phase 8: Complete Authorization Matrix', () => {
  const accounts: Awaited<ReturnType<typeof createIntegrationAccount>>[] = []

  afterAll(async () => {
    for (const acc of accounts) {
      await deleteIntegrationAccount(acc)
    }
    accounts.length = 0
  })

  it('unauthenticated routes return 401 (or 403 for admin routes, before the admin check even runs)', async () => {
    const { GET: adminOrgsGet } = await import('../app/api/admin/orgs/route')
    const { GET: adminEventsGet } = await import('../app/api/admin/events/route')
    const { POST: invoiceSendPost } = await import('../app/api/invoices/send/route')
    const { POST: pdfInvoicePost } = await import('../app/api/pdf/invoice/route')
    const { POST: notificationsCronPost } = await import('../app/api/cron/notifications/route')

    const noAuth = () => new Request('http://test/', { method: 'POST' })

    // Real, verified inconsistency: /api/admin/orgs defines its own inline
    // requirePlatformAdmin() that collapses "no auth" and "authenticated but
    // not an admin" to the same 403, unlike the shared
    // route-guard.ts#requirePlatformAdmin() that /api/admin/events (and
    // /api/admin/metrics/signups) use, which calls requireUser() first and
    // correctly returns 401 for no/invalid auth, 403 only once a real,
    // non-admin user is confirmed. Both are safe (neither leaks anything
    // without a real admin), just inconsistent HTTP semantics — noted here
    // rather than silently asserting one behavior for both.
    expect((await adminOrgsGet(noAuth())).status).toBe(403)
    expect((await adminEventsGet(noAuth())).status).toBe(401)
    expect((await invoiceSendPost(noAuth())).status).toBe(401)
    expect((await pdfInvoicePost(noAuth())).status).toBe(401)
    // The notifications cron route falls back to verifyApiSecret() when
    // there's no Bearer user, and with no INTERNAL_API_SECRET/CRON_SECRET
    // configured in this test env it allows the request through (its own
    // documented dev-mode behavior — see verifyApiSecret in api-auth.ts) —
    // so an unauthenticated request is never blocked by auth here (401/403),
    // unlike every route above. It still 500s in this specific test because
    // the all-organizations cron path then needs its own PocketBase
    // credentials (PB_EMAIL/PB_PASSWORD), which this test doesn't set up —
    // a separate concern from authorization, which is what this test covers.
    expect((await notificationsCronPost(noAuth())).status).not.toBe(401)
    expect((await notificationsCronPost(noAuth())).status).not.toBe(403)
  })

  it('invalid/malformed tokens return 401', async () => {
    // A genuinely time-expired token needs either waiting out a real JWT
    // expiry or mocking the clock; a malformed/garbage token exercises the
    // exact same authRefresh()-fails code path in authenticateRequestUser()
    // (see src/lib/server/request-auth.ts) and is the practical equivalent
    // available here.
    const { GET: adminEventsGet } = await import('../app/api/admin/events/route')
    const { POST: pdfInvoicePost } = await import('../app/api/pdf/invoice/route')

    const badAuth = () =>
      new Request('http://test/', {
        method: 'POST',
        headers: { authorization: 'Bearer not-a-real-token-at-all' },
      })

    expect((await adminEventsGet(badAuth())).status).toBe(401)
    expect((await pdfInvoicePost(badAuth())).status).toBe(401)
  })

  it('a non-member (unprovisioned, organization-less) authenticated user is rejected from org-scoped actions', async () => {
    const { admin, userId, email } = await createUnprovisionedUser(`nonmember-${Date.now()}`)
    try {
      const PocketBase = (await import('pocketbase')).default
      const pb = new PocketBase(process.env.FEATURE_PB_URL ?? process.env.PB_URL ?? '')
      pb.autoCancellation(false)
      await pb.collection('users').authWithPassword(email, 'FeatureVerification2026!aA1')
      expect(pb.authStore.record?.organization_id ?? '').toBe('')

      // authenticateRequestUser() explicitly requires a non-empty
      // organization_id and returns null otherwise — verified directly
      // (src/lib/server/request-auth.ts).
      const { authenticateRequestUser } = await import('../lib/server/request-auth')
      const result = await authenticateRequestUser(
        new Request('http://test/', { headers: { authorization: `Bearer ${pb.authStore.token}` } }),
      )
      expect(result).toBeNull()

      // And at the collection level: TENANT_RULE requires
      // organization_id = @request.auth.organization_id — an empty
      // organization_id on the auth record can never equal a real org id,
      // so creates are rejected too, not just the app-level route guard.
      const { ClientResponseError } = await import('pocketbase')
      try {
        await pb.collection('clients').create({
          name: 'Should Be Rejected',
          phone: '555-7000',
          organization_id: accounts[0]?.organizationId ?? 'irrelevant',
        })
        throw new Error('Non-member create should have been rejected')
      } catch (error) {
        expect(error instanceof ClientResponseError).toBe(true)
      }
    } finally {
      await admin.collection('users').delete(userId)
    }
  })

  it('cross-org reads return 403 or 404 at the route layer, not just the collection layer', async () => {
    const orgA = await createIntegrationAccount(`route-cross-org-a-${Date.now()}`)
    accounts.push(orgA)
    const orgB = await createIntegrationAccount(`route-cross-org-b-${Date.now()}`)
    accounts.push(orgB)

    const pkg = await orgA.pb.collection('packages').create({
      name: 'Route Boundary Package',
      base_price: 120,
      active: true,
      organization_id: orgA.organizationId,
    })
    const client = await orgA.pb.collection('clients').create({
      name: 'Route Boundary Client',
      phone: '555-7001',
      organization_id: orgA.organizationId,
    })
    const job = await orgA.pb.collection('jobs').create({
      date: '2026-12-01',
      location_type: 'mobile',
      vehicle_type: 'sedan',
      package_id: pkg.id,
      client_id: client.id,
      status: 'completed',
      revenue: 120,
      organization_id: orgA.organizationId,
    })
    const invoice = await orgA.pb.collection('invoices').create({
      job_id: job.id,
      client_id: client.id,
      organization_id: orgA.organizationId,
      invoice_number: 'INV-ROUTE-BOUNDARY',
      status: 'sent',
      subtotal: 120,
      total: 120,
      tip: 0,
      balance_due: 120,
    })

    // Org B is a real, valid, authenticated user — just not a member of the
    // org that owns this job/invoice. fetchInvoicePdfData's assertOrgRecord
    // check (src/lib/server/pdf-data.ts) should reject this at the route
    // layer before ever rendering a PDF.
    const { POST } = await import('../app/api/pdf/invoice/route')
    const response = await POST(
      new Request('http://test/api/pdf/invoice', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${orgB.pb.authStore.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ jobId: job.id, invoiceId: invoice.id }),
      }),
    )
    expect([403, 404]).toContain(response.status)
  })

  it('admin routes reject a real, valid, non-admin user across the whole admin surface', async () => {
    const account = await createIntegrationAccount(`admin-sweep-${Date.now()}`)
    accounts.push(account)

    const { GET: orgsGet } = await import('../app/api/admin/orgs/route')
    const { GET: eventsGet } = await import('../app/api/admin/events/route')
    const { GET: signupsGet } = await import('../app/api/admin/metrics/signups/route')

    const asNonAdmin = () =>
      new Request('http://test/', {
        headers: { authorization: `Bearer ${account.pb.authStore.token}` },
      })

    expect((await orgsGet(asNonAdmin())).status).toBe(403)
    expect((await eventsGet(asNonAdmin())).status).toBe(403)
    expect((await signupsGet(asNonAdmin())).status).toBe(403)
  })

  it('PocketBase list rules filter jobs and invoices by organization', async () => {
    // Phase 3 covers list-filtering for packages and clients explicitly;
    // this extends the same check to jobs and invoices, which Phase 3 only
    // checked at the single-record (getOne) level.
    const orgA = await createIntegrationAccount(`list-filter-a-${Date.now()}`)
    accounts.push(orgA)
    const orgB = await createIntegrationAccount(`list-filter-b-${Date.now()}`)
    accounts.push(orgB)

    const pkgA = await orgA.pb.collection('packages').create({
      name: 'List Filter Package A',
      base_price: 100,
      active: true,
      organization_id: orgA.organizationId,
    })
    const clientA = await orgA.pb.collection('clients').create({
      name: 'List Filter Client A',
      phone: '555-7002',
      organization_id: orgA.organizationId,
    })
    const jobA = await orgA.pb.collection('jobs').create({
      date: '2026-12-02',
      location_type: 'mobile',
      vehicle_type: 'sedan',
      package_id: pkgA.id,
      client_id: clientA.id,
      status: 'completed',
      revenue: 100,
      organization_id: orgA.organizationId,
    })
    await orgA.pb.collection('invoices').create({
      job_id: jobA.id,
      client_id: clientA.id,
      organization_id: orgA.organizationId,
      invoice_number: 'INV-LISTFILTER-A',
      status: 'draft',
      subtotal: 100,
      total: 100,
      tip: 0,
      balance_due: 100,
    })

    const pkgB = await orgB.pb.collection('packages').create({
      name: 'List Filter Package B',
      base_price: 200,
      active: true,
      organization_id: orgB.organizationId,
    })
    const clientB = await orgB.pb.collection('clients').create({
      name: 'List Filter Client B',
      phone: '555-7003',
      organization_id: orgB.organizationId,
    })
    const jobB = await orgB.pb.collection('jobs').create({
      date: '2026-12-02',
      location_type: 'mobile',
      vehicle_type: 'suv',
      package_id: pkgB.id,
      client_id: clientB.id,
      status: 'completed',
      revenue: 200,
      organization_id: orgB.organizationId,
    })
    await orgB.pb.collection('invoices').create({
      job_id: jobB.id,
      client_id: clientB.id,
      organization_id: orgB.organizationId,
      invoice_number: 'INV-LISTFILTER-B',
      status: 'draft',
      subtotal: 200,
      total: 200,
      tip: 0,
      balance_due: 200,
    })

    const jobsSeenByA = await orgA.pb.collection('jobs').getFullList()
    expect(jobsSeenByA.map((j) => j.id)).toContain(jobA.id)
    expect(jobsSeenByA.map((j) => j.id)).not.toContain(jobB.id)

    const invoicesSeenByA = await orgA.pb.collection('invoices').getFullList()
    expect(invoicesSeenByA.map((i) => i.invoice_number)).toContain('INV-LISTFILTER-A')
    expect(invoicesSeenByA.map((i) => i.invoice_number)).not.toContain('INV-LISTFILTER-B')
  })
})
