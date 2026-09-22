/**
 * Phase 7: Server Hooks and Cron Jobs
 *
 * Exercises the real PocketBase hooks and the Next.js cron routes against a
 * disposable PocketBase. Skipped without PocketBase integration config.
 */
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import {
  createIntegrationAccount,
  deleteIntegrationAccount,
  hasPocketBaseIntegrationConfig,
} from './pocketbase-integration'

const integration = hasPocketBaseIntegrationConfig()

describe.skipIf(!integration)('Phase 7: Server Hooks and Cron', () => {
  const accounts: Awaited<ReturnType<typeof createIntegrationAccount>>[] = []

  afterAll(async () => {
    for (const acc of accounts) {
      await deleteIntegrationAccount(acc)
    }
    accounts.length = 0
  })

  it('job completion hook deducts supplies and is idempotent', async () => {
    // Same mechanism as Phase 2's "inventory deduction on job completion"
    // test; kept here too since it's this phase's named scope, with an
    // explicit double-transition idempotency check.
    const account = await createIntegrationAccount(`hook-deduct-${Date.now()}`)
    accounts.push(account)

    const supply = await account.pb.collection('supplies').create({
      name: 'Hook Test Shampoo',
      unit: 'gallon',
      quantity_on_hand: 10,
      organization_id: account.organizationId,
    })
    const pkg = await account.pb.collection('packages').create({
      name: 'Hook Package',
      base_price: 100,
      active: true,
      organization_id: account.organizationId,
    })
    const client = await account.pb.collection('clients').create({
      name: 'Hook Client',
      phone: '555-9600',
      organization_id: account.organizationId,
    })
    const job = await account.pb.collection('jobs').create({
      date: '2026-11-20',
      location_type: 'mobile',
      vehicle_type: 'sedan',
      package_id: pkg.id,
      client_id: client.id,
      status: 'scheduled',
      revenue: 100,
      supplies_used: [{ supply_id: supply.id, quantity_used: 2 }],
      organization_id: account.organizationId,
    })

    await account.pb.collection('jobs').update(job.id, { status: 'completed' })
    const afterComplete = await account.pb.collection('supplies').getOne(supply.id)
    expect(afterComplete.quantity_on_hand).toBe(8)

    await account.pb.collection('jobs').update(job.id, { status: 'paid' })
    const afterPaid = await account.pb.collection('supplies').getOne(supply.id)
    expect(afterPaid.quantity_on_hand).toBe(8)
  })

  it('subscription guard rejects create for a non-founding org with an inactive subscription', async () => {
    // Everywhere else in this suite uses createIntegrationAccount(), whose
    // fixture org is always founding_member=true — which bypasses the guard.
    // This is the one test that actually exercises the rejection path with a
    // real non-founding, inactive-subscription organization.
    const { authenticateAdmin } = await import('./pocketbase-integration')
    const admin = await authenticateAdmin()
    const suffix = `inactive-org-${Date.now()}`
    const org = await admin.collection('organizations').create({
      name: `Inactive Org ${suffix}`,
      slug: suffix.slice(0, 48),
      plan: 'starter',
      founding_member: false,
      booking_enabled: true,
      subscription_status: 'canceled',
    })
    const email = `${suffix}@example.test`
    const password = 'FeatureVerification2026!aA1'
    const user = await admin.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      verified: true,
      organization_id: org.id,
    })

    try {
      const pb = new (await import('pocketbase')).default(
        process.env.FEATURE_PB_URL ?? process.env.PB_URL ?? '',
      )
      pb.autoCancellation(false)
      await pb.collection('users').authWithPassword(email, password)

      try {
        await pb.collection('clients').create({
          name: 'Should Be Rejected',
          phone: '555-9601',
          organization_id: org.id,
        })
        throw new Error('Create should have been rejected by the subscription guard')
      } catch (error) {
        const { ClientResponseError } = await import('pocketbase')
        expect(error instanceof ClientResponseError && error.status === 403).toBe(true)
      }
    } finally {
      await admin.collection('users').delete(user.id)
      await admin.collection('organizations').delete(org.id)
    }
  })

  it('subscription guard allows founding member regardless of subscription_status', async () => {
    const account = await createIntegrationAccount(`hook-founding-${Date.now()}`)
    accounts.push(account)

    const { authenticateAdmin } = await import('./pocketbase-integration')
    const admin = await authenticateAdmin()
    await admin.collection('organizations').update(account.organizationId, {
      subscription_status: 'canceled',
    })

    const client = await account.pb.collection('clients').create({
      name: 'Founding Member Client',
      phone: '555-9602',
      organization_id: account.organizationId,
    })
    expect(client.id).toBeDefined()
  })

  it('invoices_create hook assigns sequential DET-YYYY-MM-NNN numbers (no separate email-queue hook exists)', async () => {
    // There is no server-side "invoice created -> email queued" hook in
    // pocketbase/pb_hooks — verified: invoices_create.pb.js only assigns the
    // invoice_number. Sending email is an explicit client call to
    // /api/invoices/send (Phase 4), never triggered automatically on create.
    const account = await createIntegrationAccount(`hook-invoice-number-${Date.now()}`)
    accounts.push(account)

    const pkg = await account.pb.collection('packages').create({
      name: 'Numbering Hook Package',
      base_price: 100,
      active: true,
      organization_id: account.organizationId,
    })
    const client = await account.pb.collection('clients').create({
      name: 'Numbering Hook Client',
      phone: '555-9603',
      organization_id: account.organizationId,
    })
    const job = await account.pb.collection('jobs').create({
      date: '2026-11-21',
      location_type: 'mobile',
      vehicle_type: 'sedan',
      package_id: pkg.id,
      client_id: client.id,
      status: 'completed',
      revenue: 100,
      organization_id: account.organizationId,
    })

    const first = await account.pb.collection('invoices').create({
      job_id: job.id,
      client_id: client.id,
      organization_id: account.organizationId,
      invoice_number: 'PENDING',
      status: 'draft',
      subtotal: 100,
      total: 100,
      tip: 0,
      balance_due: 100,
    })
    const second = await account.pb.collection('invoices').create({
      job_id: job.id,
      client_id: client.id,
      organization_id: account.organizationId,
      invoice_number: 'PENDING',
      status: 'draft',
      subtotal: 100,
      total: 100,
      tip: 0,
      balance_due: 100,
    })

    const now = new Date()
    const prefix = `DET-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`
    expect(first.invoice_number.startsWith(prefix)).toBe(true)
    expect(second.invoice_number.startsWith(prefix)).toBe(true)
    expect(first.invoice_number).not.toBe(second.invoice_number)

    // An explicit invoice_number is respected as-is (only 'PENDING' triggers
    // auto-numbering).
    const explicit = await account.pb.collection('invoices').create({
      job_id: job.id,
      client_id: client.id,
      organization_id: account.organizationId,
      invoice_number: 'CUSTOM-001',
      status: 'draft',
      subtotal: 100,
      total: 100,
      tip: 0,
      balance_due: 100,
    })
    expect(explicit.invoice_number).toBe('CUSTOM-001')
  })

  describe('Cron routes (real HTTP handlers, real persistence)', () => {
    afterEach(async () => {
      // authenticateServerPocketBase() / authenticateServerAdmin() cache a
      // module-level singleton PocketBase client keyed by whichever
      // PB_EMAIL/PB_PASSWORD first authenticated it. Clear it between tests
      // so the next test's env vars actually take effect instead of reusing
      // a stale session.
      const { getServerPocketBase } = await import('../lib/server/pocketbase-admin')
      getServerPocketBase()?.authStore.clear()
    })

    it('recurring job generates on schedule', async () => {
      const account = await createIntegrationAccount(`cron-recurring-${Date.now()}`)
      accounts.push(account)

      const pkg = await account.pb.collection('packages').create({
        name: 'Recurring Package',
        base_price: 90,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Recurring Client',
        phone: '555-9604',
        organization_id: account.organizationId,
      })
      // Anchored weekly job, last occurrence a week in the past relative to
      // the cron's `today` cutoff, so it's due to spawn its next occurrence.
      const job = await account.pb.collection('jobs').create({
        date: '2026-01-05',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 90,
        organization_id: account.organizationId,
        recurrence_cadence: 'weekly',
        recurrence_anchor_date: '2026-01-05',
      })

      const previous = { email: process.env.PB_EMAIL, password: process.env.PB_PASSWORD }
      process.env.PB_EMAIL = account.email
      process.env.PB_PASSWORD = account.password
      try {
        const { runRecurringJobsCron } = await import('../lib/server/recurring-jobs')
        const result = await runRecurringJobsCron('2026-01-12')
        expect(result.spawned).toBeGreaterThanOrEqual(1)

        const spawned = await account.pb.collection('jobs').getFullList({
          filter: `organization_id = "${account.organizationId}" && recurrence_cadence = "weekly" && id != "${job.id}"`,
        })
        expect(spawned.length).toBeGreaterThanOrEqual(1)
        expect(spawned[0].date).toContain('2026-01-12')
      } finally {
        process.env.PB_EMAIL = previous.email
        process.env.PB_PASSWORD = previous.password
      }
    })

    it('notification cron sends overdue alerts', async () => {
      const account = await createIntegrationAccount(`cron-overdue-${Date.now()}`)
      accounts.push(account)

      const pkg = await account.pb.collection('packages').create({
        name: 'Overdue Package',
        base_price: 200,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Overdue Client',
        phone: '555-9605',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-11-01',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 200,
        organization_id: account.organizationId,
      })
      const oldSentAt = new Date()
      oldSentAt.setDate(oldSentAt.getDate() - 10)
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-OVERDUE-CRON',
        status: 'sent',
        subtotal: 200,
        total: 200,
        tip: 0,
        balance_due: 200,
        sent_at: oldSentAt.toISOString().slice(0, 10),
      })

      // runNotificationsCronForOrganization() internally calls
      // authenticateServerPocketBase(), a *separate* identity from the
      // Bearer-token requester — it needs its own PB_EMAIL/PB_PASSWORD.
      const previous = { email: process.env.PB_EMAIL, password: process.env.PB_PASSWORD }
      process.env.PB_EMAIL = account.email
      process.env.PB_PASSWORD = account.password
      try {
        const { POST } = await import('../app/api/cron/notifications/route')
        const response = await POST(
          new Request('http://test/api/cron/notifications', {
            method: 'POST',
            headers: { authorization: `Bearer ${account.pb.authStore.token}` },
          }),
        )
        expect(response.status).toBe(200)
        const payload = await response.json()
        expect(payload.ok).toBe(true)
        expect(payload.created).toBeGreaterThanOrEqual(1)

        const updatedInvoice = await account.pb.collection('invoices').getOne(invoice.id)
        expect(updatedInvoice.status).toBe('overdue')

        const logs = await account.pb.collection('notifications_log').getFullList({
          filter: `organization_id = "${account.organizationId}" && type = "invoice_overdue" && reference_id = "${invoice.id}"`,
        })
        expect(logs).toHaveLength(1)

        // Idempotency: running again the same day must not double-log.
        const second = await POST(
          new Request('http://test/api/cron/notifications', {
            method: 'POST',
            headers: { authorization: `Bearer ${account.pb.authStore.token}` },
          }),
        )
        const secondPayload = await second.json()
        expect(secondPayload.created).toBe(0)
      } finally {
        process.env.PB_EMAIL = previous.email
        process.env.PB_PASSWORD = previous.password
      }
    })
  })
})
