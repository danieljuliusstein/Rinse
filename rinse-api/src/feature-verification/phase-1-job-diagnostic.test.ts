/**
 * Phase 1: Job Creation Diagnostic Tests
 * 
 * Objective: Isolate and fix the PocketBase 400 error on job creation
 * 
 * The error manifests when trying to create a job record via:
 * - Direct collection.create()
 * - Public booking route
 * 
 * Hypothesis: Subscription guard hook or validation rule is incorrectly
 * rejecting even founding_member=true organizations.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import PocketBase, { ClientResponseError } from 'pocketbase'
import { createIntegrationAccount, deleteIntegrationAccount } from './pocketbase-integration'

describe('Phase 1: Job Creation Diagnostics', () => {
  const accounts: Awaited<ReturnType<typeof createIntegrationAccount>>[] = []
  let testAccount: Awaited<ReturnType<typeof createIntegrationAccount>>

  beforeAll(async () => {
    testAccount = await createIntegrationAccount(`job-diagnostic-${Date.now()}`)
    accounts.push(testAccount)
  })

  afterAll(async () => {
    for (const account of accounts) {
      await deleteIntegrationAccount(account)
    }
    accounts.length = 0
  })

  // Test 1: Verify organization is actually marked as founding_member
  it('organization fixture is marked founding_member', async () => {
    const admin = testAccount.pb
    const org = await admin.collection('organizations').getOne(testAccount.organizationId)
    expect(org.founding_member).toBe(true)
    expect(org.subscription_status).toBe('active')
  })

  // Test 2: Create a package (prerequisite)
  it('can create package in organization', async () => {
    const pkg = await testAccount.pb.collection('packages').create({
      name: 'Diagnostic Package',
      base_price: 100,
      active: true,
      description: 'For testing',
      organization_id: testAccount.organizationId,
    })
    expect(pkg.id).toBeDefined()
  })

  // Test 3: Create a client (prerequisite)
  it('can create client in organization', async () => {
    const client = await testAccount.pb.collection('clients').create({
      name: 'Test Client',
      phone: '555-0000',
      organization_id: testAccount.organizationId,
    })
    expect(client.id).toBeDefined()
  })

  // Test 4: Minimal job creation with all required fields
  it('minimal job creation with required fields only', async () => {
    const pkg = await testAccount.pb.collection('packages').create({
      name: 'Test Package',
      base_price: 100,
      active: true,
      organization_id: testAccount.organizationId,
    })
    const client = await testAccount.pb.collection('clients').create({
      name: 'Test Client',
      phone: '555-0000',
      organization_id: testAccount.organizationId,
    })

    const payload = {
      date: '2026-09-22',
      location_type: 'mobile',
      vehicle_type: 'sedan',
      package_id: pkg.id,
      client_id: client.id,
      status: 'scheduled',
      revenue: 100,
      organization_id: testAccount.organizationId,
    }

    console.log('Job creation payload:', JSON.stringify(payload, null, 2))

    try {
      const job = await testAccount.pb.collection('jobs').create(payload)
      expect(job.id).toBeDefined()
      console.log('✅ Job created successfully:', job.id)
    } catch (error) {
      if (error instanceof ClientResponseError) {
        console.error('❌ PocketBase error:', {
          status: error.status,
          message: error.message,
          response: error.response,
          data: error.data,
        })
        throw new Error(`Job creation failed: ${error.message}`)
      }
      throw error
    }
  })

  // Test 5: Job creation with optional fields
  it('job creation with optional fields', async () => {
    const pkg = await testAccount.pb.collection('packages').create({
      name: 'Full Package',
      base_price: 150,
      active: true,
      organization_id: testAccount.organizationId,
    })
    const client = await testAccount.pb.collection('clients').create({
      name: 'Full Client',
      phone: '555-1111',
      organization_id: testAccount.organizationId,
    })

    const payload = {
      date: '2026-09-23',
      start_time: '09:00',
      location_type: 'fixed',
      vehicle_type: 'suv',
      package_id: pkg.id,
      client_id: client.id,
      status: 'scheduled',
      revenue: 150,
      tip: 20,
      hours_worked: 2,
      organization_id: testAccount.organizationId,
    }

    try {
      const job = await testAccount.pb.collection('jobs').create(payload)
      expect(job.id).toBeDefined()
    } catch (error) {
      if (error instanceof ClientResponseError) {
        console.error('Full payload job creation failed:', error.data)
      }
      throw error
    }
  })

  // Test 6: Verify hook is not applying to jobs collection
  it('subscription guard hook does not reject founding_member org', async () => {
    // If this fails, the hook is the culprit
    const pkg = await testAccount.pb.collection('packages').create({
      name: 'Hook Test Package',
      base_price: 100,
      active: true,
      organization_id: testAccount.organizationId,
    })
    const client = await testAccount.pb.collection('clients').create({
      name: 'Hook Test Client',
      phone: '555-2222',
      organization_id: testAccount.organizationId,
    })

    // This should not fail if hook allows founding_member
    const job = await testAccount.pb.collection('jobs').create({
      date: '2026-09-24',
      location_type: 'mobile',
      vehicle_type: 'truck',
      package_id: pkg.id,
      client_id: client.id,
      status: 'scheduled',
      revenue: 100,
      organization_id: testAccount.organizationId,
    })

    expect(job.id).toBeDefined()
  })

  // Test 7: Validate server-side field constraints
  it('invalid vehicle_type is rejected', async () => {
    const pkg = await testAccount.pb.collection('packages').create({
      name: 'Validation Test Package',
      base_price: 100,
      active: true,
      organization_id: testAccount.organizationId,
    })
    const client = await testAccount.pb.collection('clients').create({
      name: 'Validation Test Client',
      phone: '555-3333',
      organization_id: testAccount.organizationId,
    })

    try {
      await testAccount.pb.collection('jobs').create({
        date: '2026-09-25',
        location_type: 'mobile',
        vehicle_type: 'invalid_type', // Invalid
        package_id: pkg.id,
        client_id: client.id,
        status: 'scheduled',
        revenue: 100,
        organization_id: testAccount.organizationId,
      })
      throw new Error('Should have rejected invalid vehicle_type')
    } catch (error) {
      expect(error instanceof ClientResponseError).toBe(true)
    }
  })

  // Test 8: Verify tenant isolation rules allow job creation
  it('tenant isolation rules allow own-org job creation', async () => {
    const pkg = await testAccount.pb.collection('packages').create({
      name: 'Tenant Test Package',
      base_price: 100,
      active: true,
      organization_id: testAccount.organizationId,
    })
    const client = await testAccount.pb.collection('clients').create({
      name: 'Tenant Test Client',
      phone: '555-4444',
      organization_id: testAccount.organizationId,
    })

    const job = await testAccount.pb.collection('jobs').create({
      date: '2026-09-26',
      location_type: 'mobile',
      vehicle_type: 'van',
      package_id: pkg.id,
      client_id: client.id,
      status: 'scheduled',
      revenue: 100,
      organization_id: testAccount.organizationId,
    })

    expect(job.id).toBeDefined()
    expect(job.organization_id).toBe(testAccount.organizationId)
  })
})
