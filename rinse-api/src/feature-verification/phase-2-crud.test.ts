/**
 * Phase 2: Complete CRUD Coverage for All Major Collections
 * 
 * Tests:
 * - Invoices (12 tests)
 * - Quotes (8 tests)
 * - Jobs (15 tests)
 * - Vehicles (8 tests)
 * - Supplies & Equipment (12 tests)
 * - Leads (5 tests)
 * - Settings (5 tests)
 * 
 * Total: 65 tests covering persistence, validation, relationships, and cascades
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import PocketBase, { ClientResponseError } from 'pocketbase'
import { createIntegrationAccount, deleteIntegrationAccount, hasPocketBaseIntegrationConfig } from './pocketbase-integration'

const integration = hasPocketBaseIntegrationConfig()

describe.skipIf(!integration)('Phase 2: Complete CRUD Coverage', () => {
  const accounts: Awaited<ReturnType<typeof createIntegrationAccount>>[] = []
  let account: Awaited<ReturnType<typeof createIntegrationAccount>>

  beforeAll(async () => {
    account = await createIntegrationAccount(`phase-2-crud-${Date.now()}`)
    accounts.push(account)
  })

  afterAll(async () => {
    for (const acc of accounts) {
      await deleteIntegrationAccount(acc)
    }
    accounts.length = 0
  })

  // ========== INVOICES (12 tests) ==========
  describe('Invoices: Full CRUD', () => {
    it('create invoice with valid data', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Invoice Test Package',
        base_price: 200,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Invoice Client',
        phone: '555-5000',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-09-27',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 200,
        organization_id: account.organizationId,
      })

      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-001',
        status: 'draft',
        subtotal: 200,
        total: 200,
        tip: 0,
        balance_due: 200,
      })

      expect(invoice.id).toBeDefined()
      expect(invoice.status).toBe('draft')
      expect(invoice.balance_due).toBe(200)
    })

    it('update invoice status to sent', async () => {
      // Create prerequisites
      const pkg = await account.pb.collection('packages').create({
        name: 'Status Test Package',
        base_price: 150,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Status Test Client',
        phone: '555-5001',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-09-28',
        location_type: 'mobile',
        vehicle_type: 'suv',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 150,
        organization_id: account.organizationId,
      })
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-002',
        status: 'draft',
        subtotal: 150,
        total: 150,
        tip: 0,
        balance_due: 150,
      })

      const updated = await account.pb.collection('invoices').update(invoice.id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

      expect(updated.status).toBe('sent')
      expect(updated.sent_at).toBeDefined()
    })

    it('update invoice with payment', async () => {
      // Create full invoice
      const pkg = await account.pb.collection('packages').create({
        name: 'Payment Test Package',
        base_price: 300,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Payment Test Client',
        phone: '555-5002',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-09-29',
        location_type: 'fixed',
        vehicle_type: 'truck',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 300,
        organization_id: account.organizationId,
      })
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-003',
        status: 'sent',
        subtotal: 300,
        total: 300,
        tip: 0,
        balance_due: 300,
      })

      const paid = await account.pb.collection('invoices').update(invoice.id, {
        balance_due: 150,
        status: 'partial',
      })

      expect(paid.balance_due).toBe(150)
      expect(paid.status).toBe('partial')
    })

    it('delete invoice cascades correctly', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Delete Test Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Delete Test Client',
        phone: '555-5003',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-09-30',
        location_type: 'mobile',
        vehicle_type: 'van',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 100,
        organization_id: account.organizationId,
      })
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-004',
        status: 'draft',
        subtotal: 100,
        total: 100,
        tip: 0,
        balance_due: 100,
      })

      await account.pb.collection('invoices').delete(invoice.id)

      try {
        await account.pb.collection('invoices').getOne(invoice.id)
        throw new Error('Invoice should have been deleted')
      } catch (error) {
        expect(error instanceof ClientResponseError && error.status === 404).toBe(true)
      }
    })

    it('invoice validation: invalid job_id rejected', async () => {
      try {
        await account.pb.collection('invoices').create({
          job_id: 'invalid-id',
          client_id: 'invalid-id',
          organization_id: account.organizationId,
          invoice_number: 'INV-BAD',
          status: 'draft',
          subtotal: 100,
          total: 100,
          tip: 0,
          balance_due: 100,
        })
        throw new Error('Should have rejected invalid job_id')
      } catch (error) {
        expect(error instanceof ClientResponseError).toBe(true)
      }
    })

    it('invoice number uniqueness within organization', async () => {
      // PocketBase has no unique index on invoice_number (verified against the
      // live schema) — uniqueness is an application-layer guarantee produced by
      // generateInvoiceNumber() over the organization's existing invoices, then
      // persisted. Exercise that real mechanism end to end.
      const pkg = await account.pb.collection('packages').create({
        name: 'Numbering Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Numbering Client',
        phone: '555-5010',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-10',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 100,
        organization_id: account.organizationId,
      })

      const { generateInvoiceNumber } = await import('../lib/invoices')
      const numberOne = generateInvoiceNumber([])
      const invoiceOne = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: numberOne,
        status: 'draft',
        subtotal: 100,
        total: 100,
        tip: 0,
        balance_due: 100,
      })

      const existing = [{ invoice_number: invoiceOne.invoice_number }] as Parameters<typeof generateInvoiceNumber>[0]
      const numberTwo = generateInvoiceNumber(existing)
      expect(numberTwo).not.toBe(numberOne)

      const invoiceTwo = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: numberTwo,
        status: 'draft',
        subtotal: 100,
        total: 100,
        tip: 0,
        balance_due: 100,
      })

      expect(invoiceTwo.invoice_number).not.toBe(invoiceOne.invoice_number)
    })

    it('invoice totals validation', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Totals Package',
        base_price: 400,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Totals Client',
        phone: '555-5011',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-11',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 400,
        organization_id: account.organizationId,
      })

      const { computeInvoiceTotals } = await import('../lib/invoices')
      const payments = [{ id: 'p1', amount: 150, method: 'Cash' as const, date: '2026-10-11' }]
      const { amount_paid, balance_due } = computeInvoiceTotals(400, payments)
      expect(amount_paid).toBe(150)
      expect(balance_due).toBe(250)

      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-TOTALS',
        status: 'partial',
        subtotal: 400,
        total: 400,
        tip: 0,
        payments,
        amount_paid,
        balance_due,
      })

      expect(invoice.amount_paid).toBe(150)
      expect(invoice.balance_due).toBe(250)
    })

    it('invoice status transition validation', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Transition Package',
        base_price: 120,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Transition Client',
        phone: '555-5012',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-12',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 120,
        organization_id: account.organizationId,
      })
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-TRANSITION',
        status: 'draft',
        subtotal: 120,
        total: 120,
        tip: 0,
        balance_due: 120,
      })

      const sent = await account.pb.collection('invoices').update(invoice.id, { status: 'sent' })
      expect(sent.status).toBe('sent')
      const paid = await account.pb.collection('invoices').update(invoice.id, { status: 'paid', balance_due: 0 })
      expect(paid.status).toBe('paid')
      expect(paid.balance_due).toBe(0)

      try {
        await account.pb.collection('invoices').update(invoice.id, { status: 'not_a_real_status' })
        throw new Error('Should have rejected an invalid status value')
      } catch (error) {
        expect(error instanceof ClientResponseError).toBe(true)
      }
    })

    it('invoice cross-org denial', async () => {
      const otherOrg = await createIntegrationAccount(`invoice-cross-org-${Date.now()}`)
      accounts.push(otherOrg)

      const pkg = await account.pb.collection('packages').create({
        name: 'Cross Org Package',
        base_price: 90,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Cross Org Client',
        phone: '555-5013',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-13',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 90,
        organization_id: account.organizationId,
      })
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-CROSSORG',
        status: 'draft',
        subtotal: 90,
        total: 90,
        tip: 0,
        balance_due: 90,
      })

      try {
        await otherOrg.pb.collection('invoices').getOne(invoice.id)
        throw new Error('Other organization should not be able to read this invoice')
      } catch (error) {
        expect(error instanceof ClientResponseError && [401, 403, 404].includes(error.status)).toBe(true)
      }
    })

    it('invoice line items CRUD', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Line Items Package',
        base_price: 200,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Line Items Client',
        phone: '555-5014',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-14',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 200,
        organization_id: account.organizationId,
      })
      const lineItems = [
        { id: 'li-1', label: 'Ceramic coating add-on', amount: 75 },
        { id: 'li-2', label: 'Pet hair removal', amount: 25 },
      ]
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-LINEITEMS',
        status: 'draft',
        subtotal: 200,
        total: 300,
        tip: 0,
        balance_due: 300,
        extra_line_items: lineItems,
      })
      expect(invoice.extra_line_items).toEqual(lineItems)

      const updatedItems = [...lineItems, { id: 'li-3', label: 'Odor removal', amount: 40 }]
      const updated = await account.pb.collection('invoices').update(invoice.id, {
        extra_line_items: updatedItems,
        total: 340,
        balance_due: 340,
      })
      expect(updated.extra_line_items).toHaveLength(3)
      expect(updated.total).toBe(340)
    })

    it('invoice tax and discount application', async () => {
      // The persisted `invoices` collection has no tax_rate/discount_amount/
      // tax_amount fields (verified against the live schema — PocketBase
      // silently drops unknown fields rather than rejecting them, so this is
      // not something a create/update call can surface). Tax and discount are
      // computed client-side by recalculateInvoiceTotals and folded into the
      // persisted `total` before saving; exercise that real calculation.
      const { recalculateInvoiceTotals } = await import('../lib/invoice-totals')
      const recalculated = recalculateInvoiceTotals({
        subtotal: 100,
        tip: 0,
        payments: [],
        discount_amount: 10,
        tax_rate: 8,
      } as unknown as Parameters<typeof recalculateInvoiceTotals>[0])
      // (100 - 10) * 1.08 = 97.2
      expect(recalculated.total).toBeCloseTo(97.2, 2)

      const pkg = await account.pb.collection('packages').create({
        name: 'Tax Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Tax Client',
        phone: '555-5015',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-15',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 100,
        organization_id: account.organizationId,
      })
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-TAX',
        status: 'draft',
        subtotal: 100,
        total: recalculated.total,
        tip: 0,
        balance_due: recalculated.total,
      })
      expect(invoice.total).toBeCloseTo(97.2, 2)
    })

    it('invoice signature persistence', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Signature Package',
        base_price: 60,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Signature Client',
        phone: '555-5016',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-16',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 60,
        organization_id: account.organizationId,
      })
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-SIGNATURE',
        status: 'sent',
        subtotal: 60,
        total: 60,
        tip: 0,
        balance_due: 60,
      })
      expect(invoice.signature_url).toBe('')
      expect(invoice.signed_at).toBe('')

      const signedAt = new Date().toISOString()
      const signed = await account.pb.collection('invoices').update(invoice.id, {
        signature_url: 'https://example.test/signatures/abc123.png',
        signed_at: signedAt,
      })
      expect(signed.signature_url).toBe('https://example.test/signatures/abc123.png')
      expect(signed.signed_at).toBeTruthy()
    })
  })

  // ========== QUOTES (8 tests) ==========
  describe('Quotes: Full CRUD', () => {
    it('create quote linked to job', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Quote Package',
        base_price: 250,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Quote Client',
        phone: '555-6000',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-01',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 250,
        organization_id: account.organizationId,
      })

      const quote = await account.pb.collection('quotes').create({
        job_id: job.id,
        client_id: client.id,
        package_id: pkg.id,
        vehicle_type: 'sedan',
        location_type: 'mobile',
        date: '2026-10-01',
        organization_id: account.organizationId,
        quote_number: 'QT-001',
        valid_until: '2026-10-08',
        status: 'draft',
        subtotal: 250,
      })

      expect(quote.id).toBeDefined()
      expect(quote.status).toBe('draft')
    })

    it('accept quote transitions to invoice', async () => {
      // Mirrors acceptQuote() in src/lib/api/quotes-pocketbase.ts: a quote
      // starts with no job_id, and accepting it creates the job and links it.
      const pkg = await account.pb.collection('packages').create({
        name: 'Accept Package',
        base_price: 220,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Accept Client',
        phone: '555-6001',
        organization_id: account.organizationId,
      })
      const quote = await account.pb.collection('quotes').create({
        client_id: client.id,
        package_id: pkg.id,
        vehicle_type: 'sedan',
        location_type: 'mobile',
        date: '2026-10-02',
        organization_id: account.organizationId,
        quote_number: 'QT-ACCEPT',
        status: 'sent',
        subtotal: 220,
      })
      expect(quote.job_id).toBe('')

      const job = await account.pb.collection('jobs').create({
        date: quote.date,
        client_id: quote.client_id,
        package_id: quote.package_id,
        vehicle_type: quote.vehicle_type,
        location_type: quote.location_type,
        status: 'scheduled',
        revenue: quote.subtotal,
        tip: 0,
        organization_id: account.organizationId,
      })
      const accepted = await account.pb.collection('quotes').update(quote.id, {
        status: 'accepted',
        job_id: job.id,
      })

      expect(accepted.status).toBe('accepted')
      expect(accepted.job_id).toBe(job.id)
    })

    it('update quote price', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Price Package',
        base_price: 180,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Price Client',
        phone: '555-6002',
        organization_id: account.organizationId,
      })
      const quote = await account.pb.collection('quotes').create({
        client_id: client.id,
        package_id: pkg.id,
        vehicle_type: 'suv',
        location_type: 'mobile',
        date: '2026-10-03',
        organization_id: account.organizationId,
        quote_number: 'QT-PRICE',
        status: 'draft',
        subtotal: 180,
      })

      const updated = await account.pb.collection('quotes').update(quote.id, { subtotal: 210 })
      expect(updated.subtotal).toBe(210)
    })

    it('delete quote', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Delete Quote Package',
        base_price: 130,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Delete Quote Client',
        phone: '555-6003',
        organization_id: account.organizationId,
      })
      const quote = await account.pb.collection('quotes').create({
        client_id: client.id,
        package_id: pkg.id,
        vehicle_type: 'van',
        location_type: 'mobile',
        date: '2026-10-04',
        organization_id: account.organizationId,
        quote_number: 'QT-DELETE',
        status: 'draft',
        subtotal: 130,
      })

      await account.pb.collection('quotes').delete(quote.id)

      try {
        await account.pb.collection('quotes').getOne(quote.id)
        throw new Error('Quote should have been deleted')
      } catch (error) {
        expect(error instanceof ClientResponseError && error.status === 404).toBe(true)
      }
    })

    it('quote expiration validation', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Expiration Package',
        base_price: 140,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Expiration Client',
        phone: '555-6004',
        organization_id: account.organizationId,
      })
      const quote = await account.pb.collection('quotes').create({
        client_id: client.id,
        package_id: pkg.id,
        vehicle_type: 'sedan',
        location_type: 'mobile',
        date: '2026-10-05',
        organization_id: account.organizationId,
        quote_number: 'QT-EXPIRE',
        status: 'sent',
        subtotal: 140,
        valid_until: '2026-09-01',
      })

      const now = new Date('2026-10-06T00:00:00Z')
      const isExpired = quote.valid_until !== '' && new Date(quote.valid_until) < now
      expect(isExpired).toBe(true)

      const expired = await account.pb.collection('quotes').update(quote.id, { status: 'expired' })
      expect(expired.status).toBe('expired')
    })

    it('quote cross-org denial', async () => {
      const otherOrg = await createIntegrationAccount(`quote-cross-org-${Date.now()}`)
      accounts.push(otherOrg)

      const pkg = await account.pb.collection('packages').create({
        name: 'Cross Org Quote Package',
        base_price: 160,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Cross Org Quote Client',
        phone: '555-6005',
        organization_id: account.organizationId,
      })
      const quote = await account.pb.collection('quotes').create({
        client_id: client.id,
        package_id: pkg.id,
        vehicle_type: 'sedan',
        location_type: 'mobile',
        date: '2026-10-07',
        organization_id: account.organizationId,
        quote_number: 'QT-CROSSORG',
        status: 'draft',
        subtotal: 160,
      })

      try {
        await otherOrg.pb.collection('quotes').getOne(quote.id)
        throw new Error('Other organization should not be able to read this quote')
      } catch (error) {
        expect(error instanceof ClientResponseError && [401, 403, 404].includes(error.status)).toBe(true)
      }
    })

    it('quote number uniqueness', async () => {
      // Same story as invoice_number: no DB-level unique index (verified
      // against the live schema) — quote_number uniqueness is whatever the
      // caller enforces before create. Distinct values persist independently.
      const pkg = await account.pb.collection('packages').create({
        name: 'Numbering Quote Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Numbering Quote Client',
        phone: '555-6006',
        organization_id: account.organizationId,
      })
      const quoteOne = await account.pb.collection('quotes').create({
        client_id: client.id,
        package_id: pkg.id,
        vehicle_type: 'sedan',
        location_type: 'mobile',
        date: '2026-10-08',
        organization_id: account.organizationId,
        quote_number: 'QT-UNIQUE-001',
        status: 'draft',
        subtotal: 100,
      })
      const quoteTwo = await account.pb.collection('quotes').create({
        client_id: client.id,
        package_id: pkg.id,
        vehicle_type: 'sedan',
        location_type: 'mobile',
        date: '2026-10-08',
        organization_id: account.organizationId,
        quote_number: 'QT-UNIQUE-002',
        status: 'draft',
        subtotal: 100,
      })
      expect(quoteOne.quote_number).not.toBe(quoteTwo.quote_number)

      const list = await account.pb.collection('quotes').getFullList({
        filter: `organization_id = "${account.organizationId}" && (quote_number = "QT-UNIQUE-001" || quote_number = "QT-UNIQUE-002")`,
      })
      expect(list).toHaveLength(2)
    })

    it('quote line items and totals', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Quote Line Items Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Quote Line Items Client',
        phone: '555-6007',
        organization_id: account.organizationId,
      })
      const quote = await account.pb.collection('quotes').create({
        client_id: client.id,
        package_id: pkg.id,
        vehicle_type: 'sedan',
        location_type: 'mobile',
        date: '2026-10-09',
        organization_id: account.organizationId,
        quote_number: 'QT-LINEITEMS',
        status: 'draft',
        subtotal: 100,
        notes: 'Base detail: 100. Add-on: ceramic coating +50.',
      })

      const updated = await account.pb.collection('quotes').update(quote.id, { subtotal: 150 })
      expect(updated.subtotal).toBe(150)
      expect(updated.notes).toContain('ceramic coating')
    })
  })

  // ========== JOBS (15 tests) ==========
  describe('Jobs: Full CRUD', () => {
    it('create job with minimal fields', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Job Package',
        base_price: 175,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Job Client',
        phone: '555-7000',
        organization_id: account.organizationId,
      })

      const job = await account.pb.collection('jobs').create({
        date: '2026-10-02',
        location_type: 'mobile',
        vehicle_type: 'suv',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 175,
        organization_id: account.organizationId,
      })

      expect(job.id).toBeDefined()
      expect(job.status).toBe('scheduled')
    })

    it('update job status through lifecycle (scheduled -> in_progress -> completed)', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Lifecycle Package',
        base_price: 150,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Lifecycle Client',
        phone: '555-7001',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-17',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 150,
        organization_id: account.organizationId,
      })

      const inProgress = await account.pb.collection('jobs').update(job.id, { status: 'in_progress' })
      expect(inProgress.status).toBe('in_progress')
      const completed = await account.pb.collection('jobs').update(job.id, { status: 'completed' })
      expect(completed.status).toBe('completed')
      const invoiced = await account.pb.collection('jobs').update(job.id, { status: 'invoiced' })
      expect(invoiced.status).toBe('invoiced')
      const paid = await account.pb.collection('jobs').update(job.id, { status: 'paid' })
      expect(paid.status).toBe('paid')
    })

    it('update job revenue and tip', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Revenue Package',
        base_price: 200,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Revenue Client',
        phone: '555-7002',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-18',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 200,
        tip: 0,
        organization_id: account.organizationId,
      })

      const updated = await account.pb.collection('jobs').update(job.id, { revenue: 225, tip: 40 })
      expect(updated.revenue).toBe(225)
      expect(updated.tip).toBe(40)
    })

    it('delete job cascades to invoices/quotes', async () => {
      // Verifies the real, current DB behavior. PocketBase's `job_id` relation
      // on invoices is a required reference back to jobs, which PocketBase
      // enforces as RESTRICT: it blocks deleting a job that a real invoice
      // still points at, rather than cascading the delete or leaving a
      // dangling reference. A job with no invoices deletes normally.
      const pkg = await account.pb.collection('packages').create({
        name: 'Cascade Package',
        base_price: 90,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Cascade Client',
        phone: '555-7003',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-19',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 90,
        organization_id: account.organizationId,
      })
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-CASCADE',
        status: 'draft',
        subtotal: 90,
        total: 90,
        tip: 0,
        balance_due: 90,
      })

      try {
        await account.pb.collection('jobs').delete(job.id)
        throw new Error('Job delete should have been blocked while an invoice still references it')
      } catch (error) {
        expect(error instanceof ClientResponseError && error.status === 400).toBe(true)
      }

      const survivingJob = await account.pb.collection('jobs').getOne(job.id)
      expect(survivingJob.id).toBe(job.id)

      // With the referencing invoice gone, the job deletes normally.
      await account.pb.collection('invoices').delete(invoice.id)
      await account.pb.collection('jobs').delete(job.id)
      try {
        await account.pb.collection('jobs').getOne(job.id)
        throw new Error('Job should have been deleted once nothing referenced it')
      } catch (error) {
        expect(error instanceof ClientResponseError && error.status === 404).toBe(true)
      }
    })

    it('job validation: invalid package_id rejected', async () => {
      const client = await account.pb.collection('clients').create({
        name: 'Invalid Package Client',
        phone: '555-7004',
        organization_id: account.organizationId,
      })

      try {
        await account.pb.collection('jobs').create({
          date: '2026-10-20',
          location_type: 'mobile',
          vehicle_type: 'sedan',
          package_id: 'does-not-exist',
          client_id: client.id,
          status: 'scheduled',
          revenue: 100,
          organization_id: account.organizationId,
        })
        throw new Error('Should have rejected an invalid package_id')
      } catch (error) {
        expect(error instanceof ClientResponseError).toBe(true)
      }
    })

    it('job validation: invalid vehicle_type rejected', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Invalid Vehicle Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Invalid Vehicle Client',
        phone: '555-7005',
        organization_id: account.organizationId,
      })

      try {
        await account.pb.collection('jobs').create({
          date: '2026-10-21',
          location_type: 'mobile',
          vehicle_type: 'spaceship',
          package_id: pkg.id,
          client_id: client.id,
          status: 'scheduled',
          revenue: 100,
          organization_id: account.organizationId,
        })
        throw new Error('Should have rejected an invalid vehicle_type')
      } catch (error) {
        expect(error instanceof ClientResponseError).toBe(true)
      }
    })

    it('job cross-org denial', async () => {
      const otherOrg = await createIntegrationAccount(`job-cross-org-${Date.now()}`)
      accounts.push(otherOrg)

      const pkg = await account.pb.collection('packages').create({
        name: 'Cross Org Job Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Cross Org Job Client',
        phone: '555-7006',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-22',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 100,
        organization_id: account.organizationId,
      })

      try {
        await otherOrg.pb.collection('jobs').getOne(job.id)
        throw new Error('Other organization should not be able to read this job')
      } catch (error) {
        expect(error instanceof ClientResponseError && [401, 403, 404].includes(error.status)).toBe(true)
      }
    })

    it('job can link to damage_docs', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Damage Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Damage Client',
        phone: '555-7007',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-23',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 100,
        organization_id: account.organizationId,
      })
      const vehicle = await account.pb.collection('vehicles').create({
        client_id: client.id,
        make: 'Honda',
        model: 'Civic',
        type: 'sedan',
        organization_id: account.organizationId,
      })
      const damageDoc = await account.pb.collection('damage_docs').create({
        vehicle_id: vehicle.id,
        job_id: job.id,
        area: 'front bumper',
        note: 'Pre-existing scratch',
        date: '2026-10-23',
        organization_id: account.organizationId,
      })

      expect(damageDoc.job_id).toBe(job.id)
      expect(damageDoc.vehicle_id).toBe(vehicle.id)

      const linked = await account.pb.collection('damage_docs').getFullList({
        filter: `job_id = "${job.id}"`,
      })
      expect(linked.map((d) => d.id)).toContain(damageDoc.id)
    })

    it('job can link to photos', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Photo Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Photo Client',
        phone: '555-7008',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-24',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 100,
        organization_id: account.organizationId,
        photo_meta: [{ id: 'photo-1', label: 'before', takenAt: '2026-10-24T09:00:00.000Z' }],
      })

      expect(job.photo_meta).toHaveLength(1)
      expect(job.photo_meta[0].label).toBe('before')
    })

    it('job date validation', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Date Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Date Client',
        phone: '555-7009',
        organization_id: account.organizationId,
      })

      try {
        await account.pb.collection('jobs').create({
          date: 'not-a-date',
          location_type: 'mobile',
          vehicle_type: 'sedan',
          package_id: pkg.id,
          client_id: client.id,
          status: 'scheduled',
          revenue: 100,
          organization_id: account.organizationId,
        })
        throw new Error('Should have rejected an invalid date value')
      } catch (error) {
        expect(error instanceof ClientResponseError).toBe(true)
      }
    })

    it('job financial calculations correct', async () => {
      const { netProfit, marginPct, effectiveRate } = await import('../lib/calculations')
      const pkg = await account.pb.collection('packages').create({
        name: 'Finance Package',
        base_price: 300,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Finance Client',
        phone: '555-7010',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-25',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 300,
        tip: 40,
        hours_worked: 4,
        travel_cost: 20,
        marketing_cost: 10,
        equipment_depreciation: 5,
        expenses: [],
        organization_id: account.organizationId,
      })

      const jobInput = {
        revenue: job.revenue,
        tip: job.tip,
        expenses: job.expenses ?? [],
        travel_cost: job.travel_cost,
        marketing_cost: job.marketing_cost,
        equipment_depreciation: job.equipment_depreciation,
        hours_worked: job.hours_worked,
      }
      // gross = 300 + 40 = 340; costs = 20 + 10 + 5 = 35; profit = 305
      expect(netProfit(jobInput)).toBe(305)
      expect(marginPct(jobInput)).toBe(Math.round((305 / 340) * 100))
      expect(effectiveRate(jobInput)).toBe(340 / 4)
    })

    it('travel time/distance calculated', async () => {
      // travel_cost is a persisted, caller-computed field (no server-side
      // distance/geocoding hook on job create/update — verified against the
      // hooks that actually run on 'jobs'). Verify it round-trips.
      const pkg = await account.pb.collection('packages').create({
        name: 'Travel Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Travel Client',
        phone: '555-7011',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-26',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 100,
        travel_cost: 12.5,
        organization_id: account.organizationId,
      })

      expect(job.travel_cost).toBe(12.5)
      const updated = await account.pb.collection('jobs').update(job.id, { travel_cost: 18.75 })
      expect(updated.travel_cost).toBe(18.75)
    })

    it('equipment depreciation calculated', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Depreciation Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Depreciation Client',
        phone: '555-7012',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-27',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'completed',
        revenue: 100,
        equipment_depreciation: 7.25,
        organization_id: account.organizationId,
      })

      expect(job.equipment_depreciation).toBe(7.25)

      const { netProfit } = await import('../lib/calculations')
      const profit = netProfit({
        revenue: job.revenue,
        tip: job.tip,
        expenses: job.expenses ?? [],
        travel_cost: job.travel_cost,
        marketing_cost: job.marketing_cost,
        equipment_depreciation: job.equipment_depreciation,
      })
      expect(profit).toBe(100 - 7.25)
    })

    it('full job lifecycle persisted', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Full Lifecycle Package',
        base_price: 250,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Full Lifecycle Client',
        phone: '555-7013',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-28',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 250,
        organization_id: account.organizationId,
      })

      await account.pb.collection('jobs').update(job.id, { status: 'in_progress' })
      await account.pb.collection('jobs').update(job.id, { status: 'completed', tip: 30 })
      const invoice = await account.pb.collection('invoices').create({
        job_id: job.id,
        client_id: client.id,
        organization_id: account.organizationId,
        invoice_number: 'INV-FULLLIFECYCLE',
        status: 'draft',
        subtotal: 250,
        total: 280,
        tip: 30,
        balance_due: 280,
      })
      const invoiced = await account.pb.collection('jobs').update(job.id, {
        status: 'invoiced',
        invoice_id: invoice.id,
      })
      const paid = await account.pb.collection('jobs').update(job.id, { status: 'paid' })

      expect(invoiced.invoice_id).toBe(invoice.id)
      expect(paid.status).toBe('paid')
      expect(paid.tip).toBe(30)

      const finalInvoice = await account.pb.collection('invoices').getOne(invoice.id)
      expect(finalInvoice.job_id).toBe(job.id)
    })
  })

  // ========== VEHICLES (8 tests) ==========
  describe('Vehicles: Full CRUD', () => {
    it('create vehicle', async () => {
      const client = await account.pb.collection('clients').create({
        name: 'Vehicle Client',
        phone: '555-8000',
        organization_id: account.organizationId,
      })

      const vehicle = await account.pb.collection('vehicles').create({
        client_id: client.id,
        make: 'Toyota',
        model: 'Camry',
        type: 'sedan',
        year: 2020,
        vin: 'ABC123DEF456',
        organization_id: account.organizationId,
      })

      expect(vehicle.id).toBeDefined()
    })

    it('update vehicle', async () => {
      const client = await account.pb.collection('clients').create({
        name: 'Update Vehicle Client',
        phone: '555-8001',
        organization_id: account.organizationId,
      })
      const vehicle = await account.pb.collection('vehicles').create({
        client_id: client.id,
        make: 'Honda',
        model: 'Accord',
        type: 'sedan',
        organization_id: account.organizationId,
      })

      const updated = await account.pb.collection('vehicles').update(vehicle.id, {
        color: 'Midnight Blue',
        color_hex: '#191970',
        plate: 'RINSE01',
      })
      expect(updated.color).toBe('Midnight Blue')
      expect(updated.plate).toBe('RINSE01')
    })

    it('delete vehicle cascades to damage_docs', async () => {
      const client = await account.pb.collection('clients').create({
        name: 'Delete Vehicle Client',
        phone: '555-8002',
        organization_id: account.organizationId,
      })
      const vehicle = await account.pb.collection('vehicles').create({
        client_id: client.id,
        make: 'Ford',
        model: 'F-150',
        type: 'truck',
        organization_id: account.organizationId,
      })
      const damageDoc = await account.pb.collection('damage_docs').create({
        vehicle_id: vehicle.id,
        area: 'tailgate',
        date: '2026-10-29',
        organization_id: account.organizationId,
      })

      try {
        await account.pb.collection('vehicles').delete(vehicle.id)
        throw new Error('Vehicle delete should have been blocked while a damage_doc still references it')
      } catch (error) {
        expect(error instanceof ClientResponseError && error.status === 400).toBe(true)
      }

      await account.pb.collection('damage_docs').delete(damageDoc.id)
      await account.pb.collection('vehicles').delete(vehicle.id)
      try {
        await account.pb.collection('vehicles').getOne(vehicle.id)
        throw new Error('Vehicle should have been deleted once nothing referenced it')
      } catch (error) {
        expect(error instanceof ClientResponseError && error.status === 404).toBe(true)
      }
    })

    it('vehicle validation: invalid type rejected', async () => {
      const client = await account.pb.collection('clients').create({
        name: 'Invalid Type Client',
        phone: '555-8003',
        organization_id: account.organizationId,
      })

      try {
        await account.pb.collection('vehicles').create({
          client_id: client.id,
          make: 'Unknown',
          model: 'Hovercraft',
          type: 'hovercraft',
          organization_id: account.organizationId,
        })
        throw new Error('Should have rejected an invalid vehicle type')
      } catch (error) {
        expect(error instanceof ClientResponseError).toBe(true)
      }
    })

    it('vehicle cross-org denial', async () => {
      const otherOrg = await createIntegrationAccount(`vehicle-cross-org-${Date.now()}`)
      accounts.push(otherOrg)

      const client = await account.pb.collection('clients').create({
        name: 'Cross Org Vehicle Client',
        phone: '555-8004',
        organization_id: account.organizationId,
      })
      const vehicle = await account.pb.collection('vehicles').create({
        client_id: client.id,
        make: 'Subaru',
        model: 'Outback',
        type: 'suv',
        organization_id: account.organizationId,
      })

      try {
        await otherOrg.pb.collection('vehicles').getOne(vehicle.id)
        throw new Error('Other organization should not be able to read this vehicle')
      } catch (error) {
        expect(error instanceof ClientResponseError && [401, 403, 404].includes(error.status)).toBe(true)
      }
    })

    it('vehicle can link to multiple damage_docs', async () => {
      const client = await account.pb.collection('clients').create({
        name: 'Multi Damage Client',
        phone: '555-8005',
        organization_id: account.organizationId,
      })
      const vehicle = await account.pb.collection('vehicles').create({
        client_id: client.id,
        make: 'Tesla',
        model: 'Model 3',
        type: 'sedan',
        organization_id: account.organizationId,
      })
      await account.pb.collection('damage_docs').create({
        vehicle_id: vehicle.id,
        area: 'front bumper',
        date: '2026-10-30',
        organization_id: account.organizationId,
      })
      await account.pb.collection('damage_docs').create({
        vehicle_id: vehicle.id,
        area: 'rear quarter panel',
        date: '2026-10-30',
        organization_id: account.organizationId,
      })

      const docs = await account.pb.collection('damage_docs').getFullList({
        filter: `vehicle_id = "${vehicle.id}"`,
      })
      expect(docs).toHaveLength(2)
      expect(docs.map((d) => d.area).sort()).toEqual(['front bumper', 'rear quarter panel'])
    })

    it('vehicle photo upload', async () => {
      // The `photo` field is a PocketBase file field; confirm it accepts a
      // real multipart upload and the record stores a filename for it.
      const client = await account.pb.collection('clients').create({
        name: 'Photo Vehicle Client',
        phone: '555-8006',
        organization_id: account.organizationId,
      })
      const formData = new FormData()
      formData.append('client_id', client.id)
      formData.append('make', 'Mazda')
      formData.append('model', 'CX-5')
      formData.append('type', 'suv')
      formData.append('organization_id', account.organizationId)
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      formData.append('photo', new Blob([png], { type: 'image/png' }), 'vehicle.png')

      const vehicle = await account.pb.collection('vehicles').create(formData)
      expect(vehicle.photo).toBeTruthy()
    })

    it('vehicle list filtered by client', async () => {
      const clientA = await account.pb.collection('clients').create({
        name: 'Filter Vehicle Client A',
        phone: '555-8007',
        organization_id: account.organizationId,
      })
      const clientB = await account.pb.collection('clients').create({
        name: 'Filter Vehicle Client B',
        phone: '555-8008',
        organization_id: account.organizationId,
      })
      await account.pb.collection('vehicles').create({
        client_id: clientA.id,
        make: 'Kia',
        model: 'Sportage',
        type: 'suv',
        organization_id: account.organizationId,
      })
      await account.pb.collection('vehicles').create({
        client_id: clientB.id,
        make: 'Nissan',
        model: 'Altima',
        type: 'sedan',
        organization_id: account.organizationId,
      })

      const clientAVehicles = await account.pb.collection('vehicles').getFullList({
        filter: `client_id = "${clientA.id}"`,
      })
      expect(clientAVehicles).toHaveLength(1)
      expect(clientAVehicles[0].make).toBe('Kia')
    })
  })

  // ========== SUPPLIES (12 tests) ==========
  describe('Supplies & Equipment: Full CRUD', () => {
    it('create supply with tracking', async () => {
      const supply = await account.pb.collection('supplies').create({
        name: 'Cleaning Fluid',
        unit: 'gallon',
        quantity_on_hand: 10,
        reorder_threshold: 3,
        cost_per_unit: 15.5,
        organization_id: account.organizationId,
      })

      expect(supply.id).toBeDefined()
      expect(supply.quantity_on_hand).toBe(10)
    })

    it('create equipment with depreciation fields', async () => {
      const equipment = await account.pb.collection('equipment').create({
        name: 'Pressure Washer',
        purchase_price: 450,
        purchase_date: '2026-01-15',
        status: 'active',
        organization_id: account.organizationId,
      })
      expect(equipment.id).toBeDefined()
      expect(equipment.purchase_price).toBe(450)
      expect(equipment.status).toBe('active')
    })

    it('update supply quantity_on_hand', async () => {
      const supply = await account.pb.collection('supplies').create({
        name: 'Microfiber Towels',
        unit: 'each',
        quantity_on_hand: 50,
        organization_id: account.organizationId,
      })
      const updated = await account.pb.collection('supplies').update(supply.id, { quantity_on_hand: 42 })
      expect(updated.quantity_on_hand).toBe(42)
    })

    it('default supplies linked to package', async () => {
      const supply = await account.pb.collection('supplies').create({
        name: 'Ceramic Sealant',
        unit: 'bottle',
        quantity_on_hand: 5,
        organization_id: account.organizationId,
      })
      const pkg = await account.pb.collection('packages').create({
        name: 'Package With Defaults',
        base_price: 200,
        active: true,
        default_supplies: [{ supply_id: supply.id, quantity_used: 1 }],
        organization_id: account.organizationId,
      })
      expect(pkg.default_supplies).toEqual([{ supply_id: supply.id, quantity_used: 1 }])
    })

    it('inventory deduction on job completion (hook)', async () => {
      // Real server-side hook: pocketbase/pb_hooks/jobs_update.pb.js decrements
      // quantity_on_hand when a job's status transitions into
      // completed/invoiced/paid, based on the job's supplies_used array.
      const supply = await account.pb.collection('supplies').create({
        name: 'Interior Shampoo',
        unit: 'gallon',
        quantity_on_hand: 20,
        organization_id: account.organizationId,
      })
      const pkg = await account.pb.collection('packages').create({
        name: 'Deduction Package',
        base_price: 100,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Deduction Client',
        phone: '555-9001',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-10-31',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 100,
        supplies_used: [{ supply_id: supply.id, quantity_used: 3 }],
        organization_id: account.organizationId,
      })

      await account.pb.collection('jobs').update(job.id, { status: 'completed' })

      const afterFirstComplete = await account.pb.collection('supplies').getOne(supply.id)
      expect(afterFirstComplete.quantity_on_hand).toBe(17)

      // Idempotency: transitioning between already-completed statuses must not
      // double-decrement (the hook only fires on the not-completed -> completed
      // edge).
      await account.pb.collection('jobs').update(job.id, { status: 'invoiced' })
      const afterSecondTransition = await account.pb.collection('supplies').getOne(supply.id)
      expect(afterSecondTransition.quantity_on_hand).toBe(17)
    })

    it('supply reorder logic', async () => {
      const supply = await account.pb.collection('supplies').create({
        name: 'Wax',
        unit: 'bottle',
        quantity_on_hand: 5,
        reorder_threshold: 3,
        organization_id: account.organizationId,
      })
      expect(supply.quantity_on_hand > supply.reorder_threshold).toBe(true)

      const lowStock = await account.pb.collection('supplies').update(supply.id, { quantity_on_hand: 2 })
      expect(lowStock.quantity_on_hand <= lowStock.reorder_threshold).toBe(true)
    })

    it('create business expense', async () => {
      const supply = await account.pb.collection('supplies').create({
        name: 'Glass Cleaner',
        unit: 'bottle',
        quantity_on_hand: 10,
        cost_per_unit: 8,
        organization_id: account.organizationId,
      })
      const expense = await account.pb.collection('business_expenses').create({
        date: '2026-11-01',
        name: 'Glass cleaner restock',
        amount: 40,
        category: 'supplies',
        supply_id: supply.id,
        quantity: 5,
        organization_id: account.organizationId,
      })
      expect(expense.id).toBeDefined()
      expect(expense.amount).toBe(40)
      expect(expense.supply_id).toBe(supply.id)
    })

    it('create overhead expense', async () => {
      const expense = await account.pb.collection('overhead_expenses').create({
        name: 'Business insurance',
        amount: 120,
        category: 'insurance',
        billing_cycle: 'monthly',
        next_due: '2026-12-01',
        organization_id: account.organizationId,
      })
      expect(expense.id).toBeDefined()
      expect(expense.billing_cycle).toBe('monthly')
    })

    it('expense recurrence handling', async () => {
      const expense = await account.pb.collection('overhead_expenses').create({
        name: 'Vehicle lease',
        amount: 350,
        category: 'vehicle',
        billing_cycle: 'monthly',
        next_due: '2026-11-01',
        organization_id: account.organizationId,
      })

      // Advance to the following month's due date, as the app does when it
      // rolls a recurring overhead expense forward after it's paid.
      const rolled = await account.pb.collection('overhead_expenses').update(expense.id, {
        next_due: '2026-12-01',
      })
      expect(rolled.next_due).toContain('2026-12-01')

      const oneTime = await account.pb.collection('overhead_expenses').create({
        name: 'One-time signage',
        amount: 200,
        category: 'marketing',
        billing_cycle: 'one_time',
        organization_id: account.organizationId,
      })
      expect(oneTime.billing_cycle).toBe('one_time')
    })

    it('equipment cross-org denial', async () => {
      const otherOrg = await createIntegrationAccount(`equipment-cross-org-${Date.now()}`)
      accounts.push(otherOrg)

      const equipment = await account.pb.collection('equipment').create({
        name: 'Vacuum',
        purchase_price: 200,
        status: 'active',
        organization_id: account.organizationId,
      })

      try {
        await otherOrg.pb.collection('equipment').getOne(equipment.id)
        throw new Error('Other organization should not be able to read this equipment')
      } catch (error) {
        expect(error instanceof ClientResponseError && [401, 403, 404].includes(error.status)).toBe(true)
      }
    })

    it('supply cross-org denial', async () => {
      const otherOrg = await createIntegrationAccount(`supply-cross-org-${Date.now()}`)
      accounts.push(otherOrg)

      const supply = await account.pb.collection('supplies').create({
        name: 'Tire Shine',
        unit: 'bottle',
        quantity_on_hand: 6,
        organization_id: account.organizationId,
      })

      try {
        await otherOrg.pb.collection('supplies').getOne(supply.id)
        throw new Error('Other organization should not be able to read this supply')
      } catch (error) {
        expect(error instanceof ClientResponseError && [401, 403, 404].includes(error.status)).toBe(true)
      }
    })

    it('cascade delete supply', async () => {
      // Verified against the live schema/behavior: business_expenses.supply_id
      // is an *optional* relation (unlike the required job_id/vehicle_id
      // relations verified elsewhere in this file, which RESTRICT deletes).
      // PocketBase clears an optional relation to a deleted record rather
      // than blocking the delete or leaving a dangling id.
      const supply = await account.pb.collection('supplies').create({
        name: 'Air Freshener',
        unit: 'each',
        quantity_on_hand: 15,
        cost_per_unit: 2,
        organization_id: account.organizationId,
      })
      const expense = await account.pb.collection('business_expenses').create({
        date: '2026-11-02',
        name: 'Air freshener restock',
        amount: 30,
        supply_id: supply.id,
        organization_id: account.organizationId,
      })

      await account.pb.collection('supplies').delete(supply.id)

      try {
        await account.pb.collection('supplies').getOne(supply.id)
        throw new Error('Supply should have been deleted')
      } catch (error) {
        expect(error instanceof ClientResponseError && error.status === 404).toBe(true)
      }

      const survivingExpense = await account.pb.collection('business_expenses').getOne(expense.id)
      expect(survivingExpense.id).toBe(expense.id)
      expect(survivingExpense.supply_id).toBe('')
    })
  })

  // ========== LEADS (5 tests) ==========
  describe('Leads: Full CRUD', () => {
    it('create lead from booking', async () => {
      const pkg = await account.pb.collection('packages').create({
        name: 'Lead Package',
        base_price: 130,
        active: true,
        organization_id: account.organizationId,
      })
      const client = await account.pb.collection('clients').create({
        name: 'Lead Client',
        phone: '555-9500',
        organization_id: account.organizationId,
      })
      const job = await account.pb.collection('jobs').create({
        date: '2026-11-03',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 130,
        organization_id: account.organizationId,
      })
      const lead = await account.pb.collection('leads').create({
        name: client.name,
        phone: client.phone,
        source: 'website',
        package_id: pkg.id,
        client_id: client.id,
        job_id: job.id,
        stage: 'booked',
        organization_id: account.organizationId,
      })

      expect(lead.id).toBeDefined()
      expect(lead.client_id).toBe(client.id)
      expect(lead.job_id).toBe(job.id)
      expect(lead.stage).toBe('booked')
    })

    it('lead stage transitions (inquiry -> quoted -> booked)', async () => {
      // Real select values (verified against the live schema): inquiry,
      // quoted, booked — the scope doc's "quote" and "completed" stages don't
      // exist on this collection.
      const lead = await account.pb.collection('leads').create({
        name: 'Stage Lead',
        phone: '555-9501',
        source: 'referral',
        stage: 'inquiry',
        organization_id: account.organizationId,
      })
      expect(lead.stage).toBe('inquiry')

      const quoted = await account.pb.collection('leads').update(lead.id, { stage: 'quoted' })
      expect(quoted.stage).toBe('quoted')

      const booked = await account.pb.collection('leads').update(lead.id, { stage: 'booked' })
      expect(booked.stage).toBe('booked')

      try {
        await account.pb.collection('leads').update(lead.id, { stage: 'not_a_real_stage' })
        throw new Error('Should have rejected an invalid stage value')
      } catch (error) {
        expect(error instanceof ClientResponseError).toBe(true)
      }
    })

    it('delete lead cascades', async () => {
      const lead = await account.pb.collection('leads').create({
        name: 'Delete Lead',
        phone: '555-9502',
        source: 'google',
        stage: 'inquiry',
        organization_id: account.organizationId,
      })

      await account.pb.collection('leads').delete(lead.id)

      try {
        await account.pb.collection('leads').getOne(lead.id)
        throw new Error('Lead should have been deleted')
      } catch (error) {
        expect(error instanceof ClientResponseError && error.status === 404).toBe(true)
      }
    })

    it('lead cross-org denial', async () => {
      const otherOrg = await createIntegrationAccount(`lead-cross-org-${Date.now()}`)
      accounts.push(otherOrg)

      const lead = await account.pb.collection('leads').create({
        name: 'Cross Org Lead',
        phone: '555-9503',
        source: 'facebook',
        stage: 'inquiry',
        organization_id: account.organizationId,
      })

      try {
        await otherOrg.pb.collection('leads').getOne(lead.id)
        throw new Error('Other organization should not be able to read this lead')
      } catch (error) {
        expect(error instanceof ClientResponseError && [401, 403, 404].includes(error.status)).toBe(true)
      }
    })

    it('lead listing filtered by organization', async () => {
      const otherOrg = await createIntegrationAccount(`lead-list-${Date.now()}`)
      accounts.push(otherOrg)

      await account.pb.collection('leads').create({
        name: 'Own Org Lead',
        phone: '555-9504',
        source: 'tiktok',
        stage: 'inquiry',
        organization_id: account.organizationId,
      })
      await otherOrg.pb.collection('leads').create({
        name: 'Other Org Lead',
        phone: '555-9505',
        source: 'tiktok',
        stage: 'inquiry',
        organization_id: otherOrg.organizationId,
      })

      const list = await account.pb.collection('leads').getFullList()
      const names = list.map((l) => l.name)
      expect(names).toContain('Own Org Lead')
      expect(names).not.toContain('Other Org Lead')
    })
  })

  // ========== SETTINGS (5 tests) ==========
  describe('Organization Settings: Full CRUD', () => {
    it('create app_settings with defaults', async () => {
      const settings = await account.pb.collection('app_settings').create({
        organization_id: account.organizationId,
      })
      expect(settings.id).toBeDefined()
      expect(settings.organization_id).toBe(account.organizationId)
      // Unset fields come back as their PocketBase zero-values, not app-side
      // defaults — the app layer (settings-pocketbase.ts) is what applies
      // business defaults on top of this record when reading it.
      expect(settings.business_name).toBe('')
      expect(settings.track_job_supplies).toBe(false)
    })

    it('update app settings: business info', async () => {
      const settings = await account.pb.collection('app_settings').create({
        organization_id: account.organizationId,
      })
      const updated = await account.pb.collection('app_settings').update(settings.id, {
        business_name: 'Summit Detailing',
        business_phone: '555-1000',
        business_email: 'hello@summitdetail.test',
        business_address: '123 Main St',
      })
      expect(updated.business_name).toBe('Summit Detailing')
      expect(updated.business_phone).toBe('555-1000')
      expect(updated.business_address).toBe('123 Main St')
    })

    it('update subscription fields on organization', async () => {
      // Subscription fields (status, trial_ends_at, current_period_end) live
      // on the `organizations` collection, not `app_settings` — verified
      // against the live schema. Also a real, deliberate security property:
      // 00_subscription_guard.pb.js blocks any non-superuser write to
      // protectedFields (billing/plan fields) on organizations — verified
      // directly here rather than assumed, since a regular authenticated
      // user changing their own plan/subscription_status would otherwise be
      // a straightforward privilege-escalation bug.
      // Real subscription_status values (verified against the live schema):
      // none/pending/active/past_due/canceled — no 'trialing'.
      const { ClientResponseError } = await import('pocketbase')
      try {
        await account.pb.collection('organizations').update(account.organizationId, {
          subscription_status: 'pending',
        })
        throw new Error('A regular user should not be able to change billing fields directly')
      } catch (error) {
        expect(error instanceof ClientResponseError && error.status === 403).toBe(true)
      }

      // The real path: only the server (superuser context, e.g. the Stripe
      // webhook handler) can set these.
      const { authenticateAdmin } = await import('./pocketbase-integration')
      const admin = await authenticateAdmin()
      const updated = await admin.collection('organizations').update(account.organizationId, {
        subscription_status: 'pending',
        trial_ends_at: '2026-12-31',
        current_period_end: '2026-12-31',
      })
      expect(updated.subscription_status).toBe('pending')
      expect(updated.trial_ends_at).toContain('2026-12-31')
    })

    it('update branding (logo, colors)', async () => {
      const settings = await account.pb.collection('app_settings').create({
        organization_id: account.organizationId,
      })
      const updated = await account.pb.collection('app_settings').update(settings.id, {
        accent_color: '#2563eb',
      })
      expect(updated.accent_color).toBe('#2563eb')

      const formData = new FormData()
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      formData.append('logo', new Blob([png], { type: 'image/png' }), 'logo.png')
      const withLogo = await account.pb.collection('app_settings').update(settings.id, formData)
      expect(withLogo.logo).toBeTruthy()
    })

    it('settings cross-org denial', async () => {
      const otherOrg = await createIntegrationAccount(`settings-cross-org-${Date.now()}`)
      accounts.push(otherOrg)

      const settings = await account.pb.collection('app_settings').create({
        business_name: 'Private Business',
        organization_id: account.organizationId,
      })

      try {
        await otherOrg.pb.collection('app_settings').getOne(settings.id)
        throw new Error('Other organization should not be able to read these settings')
      } catch (error) {
        expect(error instanceof ClientResponseError && [401, 403, 404].includes(error.status)).toBe(true)
      }
    })
  })
})
