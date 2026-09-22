/**
 * Phase 6: Mobile and Desktop Adapter Parity
 *
 * Real, boundary-aware coverage. Three things were checked empirically
 * before writing these tests:
 *
 * 1. rinse-desk/src/lib/api.ts IS runtime-importable from here (its only
 *    problematic alias import, @/lib/rinse-core, is type-only and gets
 *    erased at build time) — so real cross-adapter runtime comparison
 *    against rinse-api's own PocketBase-backed adapter is genuinely
 *    possible and done below.
 * 2. rinse-mobile/src/lib/api.ts is NOT runtime-importable from rinse-api's
 *    Vite/Vitest environment — it transitively pulls in the real
 *    `react-native` package, whose own source uses Flow type syntax
 *    ("Parse failure: Flow is not supported", confirmed against
 *    node_modules/react-native/index.js). Exercising it would need a
 *    separate test project with React Native's own Babel/Flow-aware
 *    transform (and mocks for native modules), which doesn't exist today.
 *    adapter-parity-scan.test.ts already covers mobile at the level that
 *    IS safe here: static export-shape verification.
 * 3. rinse-desk's PocketBase client defaults to the REAL PRODUCTION
 *    instance (getPbUrl() falls back to https://detailing-pb.fly.dev) when
 *    VITE_PB_URL isn't set — confirmed directly. Every test below asserts
 *    the resolved URL first and refuses to run otherwise, so a missing env
 *    var fails loudly instead of silently writing to production.
 *
 * Given (2), "offline queue replay" and "conflict resolution convergence"
 * are reframed to test the real server-side contract mobile's offline queue
 * depends on (client-generated PocketBase IDs from @rinse/core, which IS a
 * plain, RN-free package) rather than the unimportable queue code itself.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createIntegrationAccount,
  deleteIntegrationAccount,
  hasPocketBaseIntegrationConfig,
} from './pocketbase-integration'

const integration = hasPocketBaseIntegrationConfig()
const pbUrl = process.env.FEATURE_PB_URL ?? process.env.PB_URL ?? ''

describe.skipIf(!integration)('Phase 6: Mobile/Desktop Parity', () => {
  const accounts: Awaited<ReturnType<typeof createIntegrationAccount>>[] = []

  beforeAll(() => {
    process.env.VITE_PB_URL = pbUrl
  })

  afterAll(async () => {
    for (const acc of accounts) {
      await deleteIntegrationAccount(acc)
    }
    accounts.length = 0
  })

  it('create client produces the same persisted shape across the api and desk adapters', async () => {
    const account = await createIntegrationAccount(`parity-client-${Date.now()}`)
    accounts.push(account)

    // rinse-api's own PocketBase-backed adapter (src/lib/api/pocketbase.ts,
    // not the auto-detecting index.ts wrapper, which does browser-oriented
    // local/PocketBase backend selection that doesn't apply here).
    const { getPocketBase } = await import('../lib/pocketbase')
    const apiPb = getPocketBase()
    if (!apiPb) throw new Error('rinse-api PocketBase client not configured (NEXT_PUBLIC_PB_URL)')
    apiPb.authStore.save(account.pb.authStore.token, account.pb.authStore.record)
    const apiAdapter = await import('../lib/api/pocketbase')
    const apiClient = await apiAdapter.createClient({ name: 'Parity Client API', phone: '555-6100' })

    // rinse-desk's adapter, a genuinely separate module/codebase, pointed at
    // the same disposable instance and authenticated as the same account.
    expect(pbUrl).toBeTruthy()
    expect(pbUrl).not.toContain('detailing-pb.fly.dev')
    const deskPocketbase = await import('../../../rinse-desk/src/lib/pocketbase')
    const resolvedDeskUrl = deskPocketbase.getPbUrl()
    expect(resolvedDeskUrl).toBe(pbUrl)
    const deskPb = deskPocketbase.getPocketBase()
    deskPb.authStore.save(account.pb.authStore.token, account.pb.authStore.record)
    const deskAdapter = await import('../../../rinse-desk/src/lib/api')
    const deskClient = await deskAdapter.createClient({ name: 'Parity Client Desk', phone: '555-6101' })

    // Both adapters wrote through to the same disposable PocketBase — verify
    // via a third, independent read (the integration account's own client)
    // rather than trusting either adapter's own return value.
    const apiRecord = await account.pb.collection('clients').getOne(apiClient.id)
    const deskRecord = await account.pb.collection('clients').getOne(deskClient.id)
    expect(apiRecord.organization_id).toBe(account.organizationId)
    expect(deskRecord.organization_id).toBe(account.organizationId)
    expect(apiRecord.phone).toBe('555-6100')
    expect(deskRecord.phone).toBe('555-6101')
    // Both adapters normalize to the same shape: a string id, tags as an
    // array (not null), matching what pbClientToApp/mapClient each promise.
    expect(typeof apiClient.id).toBe('string')
    expect(typeof deskClient.id).toBe('string')
    expect(Array.isArray(deskClient.tags)).toBe(true)
  })

  it('offline replay is idempotent: a client-generated id can only create once', async () => {
    // This is the real mechanism rinse-mobile's offline queue relies on
    // (generatePocketBaseId() in packages/core, used before a write is
    // queued so a later retry/replay is safe) — verified here server-side
    // since the mobile queue code itself isn't importable from here (see
    // file header).
    const account = await createIntegrationAccount(`parity-offline-${Date.now()}`)
    accounts.push(account)

    const { generatePocketBaseId } = await import('../../../packages/core/src/index')
    const clientId = generatePocketBaseId()
    expect(clientId).toHaveLength(15)

    const first = await account.pb.collection('clients').create({
      id: clientId,
      name: 'Offline Queued Client',
      phone: '555-6102',
      organization_id: account.organizationId,
    })
    expect(first.id).toBe(clientId)

    // Simulate the queue replaying the same queued write again (e.g. after
    // a crash before the "synced" flag was persisted, or a retried
    // request) — must fail cleanly, not silently duplicate.
    const { ClientResponseError } = await import('pocketbase')
    try {
      await account.pb.collection('clients').create({
        id: clientId,
        name: 'Offline Queued Client',
        phone: '555-6102',
        organization_id: account.organizationId,
      })
      throw new Error('Replaying the same client-generated id should have been rejected')
    } catch (error) {
      expect(error instanceof ClientResponseError && error.status === 400).toBe(true)
    }

    const matches = await account.pb.collection('clients').getFullList({
      filter: `organization_id = "${account.organizationId}" && phone = "555-6102"`,
    })
    expect(matches).toHaveLength(1)
  })

  it('conflict resolution converges: an id collision never silently overwrites a different record', async () => {
    const account = await createIntegrationAccount(`parity-conflict-${Date.now()}`)
    accounts.push(account)

    const { generatePocketBaseId } = await import('../../../packages/core/src/index')
    const idA = generatePocketBaseId()
    const idB = generatePocketBaseId()
    expect(idA).not.toBe(idB)

    await account.pb.collection('clients').create({
      id: idA,
      name: 'Client A',
      phone: '555-6103',
      organization_id: account.organizationId,
    })

    const { ClientResponseError } = await import('pocketbase')
    // A hypothetical id collision (e.g. two devices independently generating
    // the same id — astronomically unlikely at 15 base36 chars, but this is
    // exactly the safety property convergence depends on) must reject, not
    // overwrite Client A with different data under the same id.
    try {
      await account.pb.collection('clients').create({
        id: idA,
        name: 'Completely Different Client',
        phone: '555-9999',
        organization_id: account.organizationId,
      })
      throw new Error('A colliding id with different data should have been rejected, not merged')
    } catch (error) {
      expect(error instanceof ClientResponseError && error.status === 400).toBe(true)
    }

    const unchanged = await account.pb.collection('clients').getOne(idA)
    expect(unchanged.name).toBe('Client A')
    expect(unchanged.phone).toBe('555-6103')

    // idB remains free to use normally.
    const created = await account.pb.collection('clients').create({
      id: idB,
      name: 'Client B',
      phone: '555-6104',
      organization_id: account.organizationId,
    })
    expect(created.id).toBe(idB)
  })

  it('mobile photo capture integrates: server accepts a real multipart photo upload to a job', async () => {
    // The camera capture itself is client-native and can't be exercised
    // here (see file header) — this verifies the server-side half of what
    // mobile's photo capture ultimately does: upload a real image file to
    // jobs.photos. Complements Phase 2's "job can link to photos" (which
    // only covers the photo_meta JSON, not an actual file).
    const account = await createIntegrationAccount(`parity-photo-${Date.now()}`)
    accounts.push(account)

    const pkg = await account.pb.collection('packages').create({
      name: 'Photo Parity Package',
      base_price: 100,
      active: true,
      organization_id: account.organizationId,
    })
    const client = await account.pb.collection('clients').create({
      name: 'Photo Parity Client',
      phone: '555-6105',
      organization_id: account.organizationId,
    })

    const formData = new FormData()
    formData.append('date', '2026-11-30')
    formData.append('location_type', 'mobile')
    formData.append('vehicle_type', 'sedan')
    formData.append('package_id', pkg.id)
    formData.append('client_id', client.id)
    formData.append('status', 'completed')
    formData.append('revenue', '100')
    formData.append('organization_id', account.organizationId)
    // jobs_photo_validate.pb.js reads the first 12 bytes to check magic
    // numbers (see Phase 2's vehicle photo test, which uses a PNG signature
    // the same way) — pad past a bare 3-byte JPEG marker.
    const jpeg = new Uint8Array(256)
    jpeg.set([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0x4a, 0x46, 0x49, 0x46])
    formData.append('photos', new Blob([jpeg], { type: 'image/jpeg' }), 'capture.jpg')

    const job = await account.pb.collection('jobs').create(formData)
    expect(Array.isArray(job.photos) ? job.photos.length : job.photos ? 1 : 0).toBeGreaterThan(0)
  })
})
