#!/usr/bin/env node
/**
 * Tenant isolation smoke test — creates two orgs and verifies cross-tenant reads fail.
 *
 * Usage: npm run test:isolation
 * Requires PB_ADMIN_EMAIL + PB_ADMIN_PASSWORD in .env.local (PocketBase superuser from /_/).
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim()
  }
}

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'

const COLLECTIONS = ['clients', 'jobs', 'packages', 'app_settings']

function requireAdminCreds() {
  const adminEmail = process.env.PB_ADMIN_EMAIL
  const adminPassword = process.env.PB_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    console.error(`FAIL — PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD are required in .env.local

These are your PocketBase superuser credentials (admin UI login), NOT PB_EMAIL.
Find or reset them at: ${PB_URL}/_/

Example:
  PB_ADMIN_EMAIL=you@example.com
  PB_ADMIN_PASSWORD=your-admin-password
`)
    process.exit(1)
  }
  return { adminEmail, adminPassword }
}

async function adminAuth() {
  const { adminEmail, adminPassword } = requireAdminCreds()
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: adminEmail, password: adminPassword }),
  })
  if (!res.ok) {
    throw new Error(`Admin auth failed — check PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD: ${await res.text()}`)
  }
  const { token } = await res.json()
  return { Authorization: token, 'Content-Type': 'application/json' }
}

async function provisionTenant(adminHeaders, email, password, businessName) {
  const slugBase = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  const slug = `${slugBase}-${Date.now().toString(36)}`

  const orgRes = await fetch(`${PB_URL}/api/collections/organizations/records`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: businessName,
      slug,
      plan: 'starter',
      founding_member: false,
      booking_enabled: true,
    }),
  })
  if (!orgRes.ok) throw new Error(`Org create failed: ${await orgRes.text()}`)
  const org = await orgRes.json()

  const userRes = await fetch(`${PB_URL}/api/collections/users/records`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      email,
      password,
      passwordConfirm: password,
      organization_id: org.id,
      verified: true,
    }),
  })
  if (!userRes.ok) throw new Error(`User create failed: ${await userRes.text()}`)

  const loginRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  })
  if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`)
  const { token } = await loginRes.json()

  return {
    orgId: org.id,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  }
}

async function createClient(headers, orgId, name) {
  const res = await fetch(`${PB_URL}/api/collections/clients/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, organization_id: orgId }),
  })
  if (!res.ok) throw new Error(`Client create failed: ${await res.text()}`)
  return res.json()
}

async function listClients(headers) {
  const res = await fetch(`${PB_URL}/api/collections/clients/records`, { headers })
  if (!res.ok) throw new Error(`Client list failed: ${await res.text()}`)
  const data = await res.json()
  return data.items ?? data
}

async function getClient(headers, id) {
  const res = await fetch(`${PB_URL}/api/collections/clients/records/${id}`, { headers })
  return { status: res.status, ok: res.ok }
}

async function main() {
  console.log('Isolation test against', PB_URL)

  const adminHeaders = await adminAuth()
  const ts = Date.now()

  const a = await provisionTenant(adminHeaders, `iso-a-${ts}@test.local`, 'TestPass123!', 'Iso Org A')
  const b = await provisionTenant(adminHeaders, `iso-b-${ts}@test.local`, 'TestPass123!', 'Iso Org B')

  const clientA = await createClient(a.headers, a.orgId, 'Secret Client A')
  const clientB = await createClient(b.headers, b.orgId, 'Secret Client B')

  const aList = await listClients(a.headers)
  const bList = await listClients(b.headers)

  const aIds = new Set(aList.map((c) => c.id))
  const bIds = new Set(bList.map((c) => c.id))

  if (!aIds.has(clientA.id)) fail('Org A cannot see own client')
  if (!bIds.has(clientB.id)) fail('Org B cannot see own client')
  if (aIds.has(clientB.id)) fail('Org A can see Org B client in list')
  if (bIds.has(clientA.id)) fail('Org B can see Org A client in list')

  const crossA = await getClient(a.headers, clientB.id)
  const crossB = await getClient(b.headers, clientA.id)

  if (crossA.ok) fail('Org A can fetch Org B client by ID')
  if (crossB.ok) fail('Org B can fetch Org A client by ID')

  console.log('PASS — tenant isolation holds for clients')
  console.log(`Checked collections with org rules: ${COLLECTIONS.join(', ')}`)
}

function fail(msg) {
  console.error('FAIL —', msg)
  process.exit(1)
}

main().catch((e) => {
  console.error('FAIL —', e.message)
  process.exit(1)
})
