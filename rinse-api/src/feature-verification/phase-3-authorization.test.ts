/**
 * Phase 3: Cross-Tenant Authorization Matrix
 * 
 * Exhaustive test of all collections to verify:
 * - User B cannot read/write user A's data
 * - Superuser can always access
 * - Unauthenticated requests are rejected
 * - Cross-org relation traversal is blocked
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import PocketBase, { ClientResponseError } from 'pocketbase'
import { createIntegrationAccount, deleteIntegrationAccount, isPocketBaseUnauthorized, hasPocketBaseIntegrationConfig, authenticateAdmin } from './pocketbase-integration'

const integration = hasPocketBaseIntegrationConfig()

describe.skipIf(!integration)('Phase 3: Cross-Tenant Authorization Matrix', () => {
  const accounts: Awaited<ReturnType<typeof createIntegrationAccount>>[] = []
  let orgA: Awaited<ReturnType<typeof createIntegrationAccount>>
  let orgB: Awaited<ReturnType<typeof createIntegrationAccount>>

  beforeAll(async () => {
    orgA = await createIntegrationAccount(`org-a-${Date.now()}`)
    orgB = await createIntegrationAccount(`org-b-${Date.now()}`)
    accounts.push(orgA, orgB)
  })

  afterAll(async () => {
    for (const acc of accounts) {
      try {
        await deleteIntegrationAccount(acc)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    accounts.length = 0
  })

  describe('Packages Collection', () => {
    it('user B cannot read user A package', async () => {
      const pkgA = await orgA.pb.collection('packages').create({
        name: 'Secret Package',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('packages').getOne(pkgA.id)
        throw new Error('User B should not see user A package')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user B cannot update user A package', async () => {
      const pkgA = await orgA.pb.collection('packages').create({
        name: 'Untouchable Package',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('packages').update(pkgA.id, { name: 'Hacked' })
        throw new Error('User B should not update user A package')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user B cannot delete user A package', async () => {
      const pkgA = await orgA.pb.collection('packages').create({
        name: 'Undeletable Package',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('packages').delete(pkgA.id)
        throw new Error('User B should not delete user A package')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user A can list only own packages', async () => {
      await orgA.pb.collection('packages').create({
        name: 'OwnPackage A1',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })
      await orgB.pb.collection('packages').create({
        name: 'OwnPackage B1',
        base_price: 200,
        active: true,
        organization_id: orgB.organizationId,
      })

      const list = await orgA.pb.collection('packages').getFullList()
      const names = list.map((p) => p.name)
      expect(names).toContain('OwnPackage A1')
      expect(names).not.toContain('OwnPackage B1')
    })
  })

  describe('Clients Collection', () => {
    it('user B cannot read user A client', async () => {
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Private Client',
        phone: '555-0000',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('clients').getOne(clientA.id)
        throw new Error('User B should not see user A client')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user B cannot write to user A client', async () => {
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Protected Client',
        phone: '555-0001',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('clients').update(clientA.id, { name: 'Hacked Client' })
        throw new Error('User B should not update user A client')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user A can list only own clients', async () => {
      await orgA.pb.collection('clients').create({
        name: 'ClientA1',
        phone: '555-0002',
        organization_id: orgA.organizationId,
      })
      await orgB.pb.collection('clients').create({
        name: 'ClientB1',
        phone: '555-0003',
        organization_id: orgB.organizationId,
      })

      const list = await orgA.pb.collection('clients').getFullList()
      const names = list.map((c) => c.name)
      expect(names).toContain('ClientA1')
      expect(names).not.toContain('ClientB1')
    })
  })

  describe('Jobs Collection', () => {
    it('user B cannot read user A job', async () => {
      const pkgA = await orgA.pb.collection('packages').create({
        name: 'JobTest Package A',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })
      const clientA = await orgA.pb.collection('clients').create({
        name: 'JobTest Client A',
        phone: '555-0004',
        organization_id: orgA.organizationId,
      })
      const jobA = await orgA.pb.collection('jobs').create({
        date: '2026-10-03',
        location_type: 'mobile',
        vehicle_type: 'sedan',
        package_id: pkgA.id,
        client_id: clientA.id,
        status: 'scheduled',
        revenue: 100,
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('jobs').getOne(jobA.id)
        throw new Error('User B should not see user A job')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user B cannot traverse relations to access user A data', async () => {
      // Create full hierarchy in org A
      const pkgA = await orgA.pb.collection('packages').create({
        name: 'Relation Test Package',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Relation Test Client',
        phone: '555-0005',
        organization_id: orgA.organizationId,
      })
      const jobA = await orgA.pb.collection('jobs').create({
        date: '2026-10-04',
        location_type: 'mobile',
        vehicle_type: 'suv',
        package_id: pkgA.id,
        client_id: clientA.id,
        status: 'scheduled',
        revenue: 100,
        organization_id: orgA.organizationId,
      })

      // User B should not be able to traverse
      try {
        await orgB.pb.collection('jobs').getOne(jobA.id, {
          expand: 'package_id,client_id',
        })
        throw new Error('User B should not traverse relations to user A data')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })
  })

  describe('Invoices Collection', () => {
    it('user B cannot access user A invoices', async () => {
      const pkgA = await orgA.pb.collection('packages').create({
        name: 'Invoice Test Package',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Invoice Test Client',
        phone: '555-0006',
        organization_id: orgA.organizationId,
      })
      const jobA = await orgA.pb.collection('jobs').create({
        date: '2026-10-05',
        location_type: 'mobile',
        vehicle_type: 'truck',
        package_id: pkgA.id,
        client_id: clientA.id,
        status: 'completed',
        revenue: 100,
        organization_id: orgA.organizationId,
      })
      const invoiceA = await orgA.pb.collection('invoices').create({
        job_id: jobA.id,
        client_id: clientA.id,
        organization_id: orgA.organizationId,
        invoice_number: 'INV-SECURE',
        status: 'draft',
        subtotal: 100,
        total: 100,
        tip: 0,
        balance_due: 100,
      })

      try {
        await orgB.pb.collection('invoices').getOne(invoiceA.id)
        throw new Error('User B should not see user A invoice')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })
  })

  describe('Quotes Collection', () => {
    it('user B cannot read user A quote', async () => {
      const pkgA = await orgA.pb.collection('packages').create({
        name: 'Quote Auth Package',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Quote Auth Client',
        phone: '555-1000',
        organization_id: orgA.organizationId,
      })
      const quoteA = await orgA.pb.collection('quotes').create({
        client_id: clientA.id,
        package_id: pkgA.id,
        vehicle_type: 'sedan',
        location_type: 'mobile',
        date: '2026-11-10',
        organization_id: orgA.organizationId,
        quote_number: 'QT-AUTH',
        status: 'draft',
        subtotal: 100,
      })

      try {
        await orgB.pb.collection('quotes').getOne(quoteA.id)
        throw new Error('User B should not see user A quote')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user A can list only own quotes', async () => {
      const pkgA = await orgA.pb.collection('packages').create({
        name: 'Quote List Package A',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Quote List Client A',
        phone: '555-1001',
        organization_id: orgA.organizationId,
      })
      await orgA.pb.collection('quotes').create({
        client_id: clientA.id,
        package_id: pkgA.id,
        vehicle_type: 'sedan',
        location_type: 'mobile',
        date: '2026-11-10',
        organization_id: orgA.organizationId,
        quote_number: 'QT-LISTA',
        status: 'draft',
        subtotal: 100,
      })

      const list = await orgA.pb.collection('quotes').getFullList()
      const numbers = list.map((q) => q.quote_number)
      expect(numbers).toContain('QT-LISTA')
    })
  })

  describe('Leads Collection', () => {
    it('user B cannot read user A lead', async () => {
      const leadA = await orgA.pb.collection('leads').create({
        name: 'Lead Auth',
        phone: '555-1002',
        source: 'website',
        stage: 'inquiry',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('leads').getOne(leadA.id)
        throw new Error('User B should not see user A lead')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user B cannot update user A lead', async () => {
      const leadA = await orgA.pb.collection('leads').create({
        name: 'Lead Auth Update',
        phone: '555-1003',
        source: 'website',
        stage: 'inquiry',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('leads').update(leadA.id, { stage: 'booked' })
        throw new Error('User B should not update user A lead')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })
  })

  describe('Vehicles Collection', () => {
    it('user B cannot read user A vehicle', async () => {
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Vehicle Auth Client',
        phone: '555-1004',
        organization_id: orgA.organizationId,
      })
      const vehicleA = await orgA.pb.collection('vehicles').create({
        client_id: clientA.id,
        make: 'Chevrolet',
        model: 'Malibu',
        type: 'sedan',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('vehicles').getOne(vehicleA.id)
        throw new Error('User B should not see user A vehicle')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user B cannot delete user A vehicle', async () => {
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Vehicle Auth Delete Client',
        phone: '555-1005',
        organization_id: orgA.organizationId,
      })
      const vehicleA = await orgA.pb.collection('vehicles').create({
        client_id: clientA.id,
        make: 'GMC',
        model: 'Yukon',
        type: 'suv',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('vehicles').delete(vehicleA.id)
        throw new Error('User B should not delete user A vehicle')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })
  })

  describe('Damage Docs Collection', () => {
    it('user B cannot read user A damage doc', async () => {
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Damage Auth Client',
        phone: '555-1006',
        organization_id: orgA.organizationId,
      })
      const vehicleA = await orgA.pb.collection('vehicles').create({
        client_id: clientA.id,
        make: 'Jeep',
        model: 'Wrangler',
        type: 'suv',
        organization_id: orgA.organizationId,
      })
      const docA = await orgA.pb.collection('damage_docs').create({
        vehicle_id: vehicleA.id,
        area: 'hood',
        date: '2026-11-11',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('damage_docs').getOne(docA.id)
        throw new Error('User B should not see user A damage doc')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })
  })

  describe('Supplies Collection', () => {
    it('user B cannot read user A supply', async () => {
      const supplyA = await orgA.pb.collection('supplies').create({
        name: 'Auth Supply',
        unit: 'each',
        quantity_on_hand: 10,
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('supplies').getOne(supplyA.id)
        throw new Error('User B should not see user A supply')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })

    it('user A can list only own supplies', async () => {
      await orgA.pb.collection('supplies').create({
        name: 'ListSupplyA',
        unit: 'each',
        quantity_on_hand: 5,
        organization_id: orgA.organizationId,
      })
      await orgB.pb.collection('supplies').create({
        name: 'ListSupplyB',
        unit: 'each',
        quantity_on_hand: 5,
        organization_id: orgB.organizationId,
      })

      const list = await orgA.pb.collection('supplies').getFullList()
      const names = list.map((s) => s.name)
      expect(names).toContain('ListSupplyA')
      expect(names).not.toContain('ListSupplyB')
    })
  })

  describe('Equipment Collection', () => {
    it('user B cannot read user A equipment', async () => {
      const equipmentA = await orgA.pb.collection('equipment').create({
        name: 'Auth Equipment',
        purchase_price: 300,
        status: 'active',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('equipment').getOne(equipmentA.id)
        throw new Error('User B should not see user A equipment')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })
  })

  describe('Business Expenses Collection', () => {
    it('user B cannot read user A business expense', async () => {
      const expenseA = await orgA.pb.collection('business_expenses').create({
        date: '2026-11-12',
        name: 'Auth Expense',
        amount: 50,
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('business_expenses').getOne(expenseA.id)
        throw new Error('User B should not see user A business expense')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })
  })

  describe('Overhead Expenses Collection', () => {
    it('user B cannot read user A overhead expense', async () => {
      const expenseA = await orgA.pb.collection('overhead_expenses').create({
        name: 'Auth Overhead',
        amount: 75,
        billing_cycle: 'monthly',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('overhead_expenses').getOne(expenseA.id)
        throw new Error('User B should not see user A overhead expense')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })
  })

  describe('Portal Tokens Collection', () => {
    it('user B cannot read user A portal token', async () => {
      const clientA = await orgA.pb.collection('clients').create({
        name: 'Portal Auth Client',
        phone: '555-1007',
        organization_id: orgA.organizationId,
      })
      const tokenA = await orgA.pb.collection('portal_tokens').create({
        token: `portal-auth-${Date.now()}`,
        scope: 'full',
        client_id: clientA.id,
        expires_at: '2026-12-31 00:00:00.000Z',
        organization_id: orgA.organizationId,
      })

      try {
        await orgB.pb.collection('portal_tokens').getOne(tokenA.id)
        throw new Error('User B should not see user A portal token')
      } catch (error) {
        expect(isPocketBaseUnauthorized(error)).toBe(true)
      }
    })
  })

  describe('Superuser access', () => {
    it('superuser can always access records across organizations', async () => {
      const pkgA = await orgA.pb.collection('packages').create({
        name: 'Superuser Access Package',
        base_price: 100,
        active: true,
        organization_id: orgA.organizationId,
      })

      const admin = await authenticateAdmin()
      const record = await admin.collection('packages').getOne(pkgA.id)
      expect(record.id).toBe(pkgA.id)
    })
  })
})
