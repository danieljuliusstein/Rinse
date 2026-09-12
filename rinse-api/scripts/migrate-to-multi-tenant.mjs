#!/usr/bin/env node
/**
 * Backfill organization_id for existing single-tenant data.
 * Usage: node scripts/migrate-to-multi-tenant.mjs
 * Loads .env.local automatically (or set PB_URL, PB_EMAIL, PB_PASSWORD).
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
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD

const ATLAS_SLUG = process.env.ATLAS_ORG_SLUG || 'atlas-detailing'
const ATLAS_NAME = process.env.ATLAS_ORG_NAME || 'Atlas Detailing'

const DATA_COLLECTIONS = [
  'packages',
  'clients',
  'supplies',
  'equipment',
  'overhead_expenses',
  'business_expenses',
  'app_settings',
  'notifications_log',
  'jobs',
  'invoices',
  'quotes',
  'vehicles',
  'damage_docs',
  'portal_tokens',
]

async function auth() {
  const adminEmail = process.env.PB_ADMIN_EMAIL
  const adminPassword = process.env.PB_ADMIN_PASSWORD

  if (adminEmail && adminPassword) {
    const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: adminEmail, password: adminPassword }),
    })
    if (res.ok) {
      const { token } = await res.json()
      return { Authorization: token, 'Content-Type': 'application/json' }
    }
    console.warn('Admin auth failed, falling back to app user:', await res.text())
  }

  if (!PB_EMAIL || !PB_PASSWORD) {
    console.error('Set PB_EMAIL and PB_PASSWORD (or PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD in .env.local)')
    process.exit(1)
  }
  const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
  })
  if (!res.ok) {
    console.error('Auth failed:', await res.text())
    process.exit(1)
  }
  const { token } = await res.json()
  return { Authorization: token, 'Content-Type': 'application/json' }
}

async function listAll(headers, collection) {
  const items = []
  let page = 1
  while (true) {
    const res = await fetch(
      `${PB_URL}/api/collections/${collection}/records?perPage=200&page=${page}`,
      { headers },
    )
    if (!res.ok) throw new Error(`List ${collection}: ${await res.text()}`)
    const data = await res.json()
    items.push(...(data.items ?? []))
    if (page >= (data.totalPages ?? 1)) break
    page++
  }
  return items
}

async function patch(headers, collection, id, body) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Patch ${collection}/${id}: ${await res.text()}`)
  return res.json()
}

async function create(headers, collection, body) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Create ${collection}: ${await res.text()}`)
  return res.json()
}

async function main() {
  const headers = await auth()

  let orgs = await listAll(headers, 'organizations')
  let org = orgs.find((o) => o.slug === ATLAS_SLUG)

  if (!org) {
    const settings = await listAll(headers, 'app_settings')
    const name = settings[0]?.business_name || ATLAS_NAME
    org = await create(headers, 'organizations', {
      name,
      slug: ATLAS_SLUG,
      plan: 'founding',
      founding_member: true,
      booking_enabled: true,
    })
    console.log('Created organization:', org.id, org.slug)
  } else {
    console.log('Organization exists:', org.id, org.slug)
  }

  const orgId = org.id

  for (const collection of DATA_COLLECTIONS) {
    const records = await listAll(headers, collection)
    let updated = 0
    for (const record of records) {
      if (record.organization_id === orgId) continue
      await patch(headers, collection, record.id, { organization_id: orgId })
      updated++
    }
    const orphans = records.filter((r) => r.organization_id && r.organization_id !== orgId)
    if (orphans.length) {
      console.error(`WARNING: ${collection} has ${orphans.length} records on other orgs`)
    }
    console.log(`${collection}: ${records.length} total, ${updated} backfilled`)
  }

  const users = await listAll(headers, 'users')
  for (const user of users) {
    if (user.organization_id === orgId) continue
    await patch(headers, 'users', user.id, { organization_id: orgId })
    console.log('Linked user to org:', user.email)
  }

  for (const collection of DATA_COLLECTIONS) {
    const records = await listAll(headers, collection)
    const missing = records.filter((r) => !r.organization_id)
    if (missing.length) {
      console.error(`FAIL: ${collection} has ${missing.length} records without organization_id`)
      process.exit(1)
    }
  }

  console.log('Done — all records assigned to', ATLAS_SLUG)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
