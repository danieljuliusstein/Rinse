#!/usr/bin/env node
/**
 * Delete ALL app records from PocketBase (full reset).
 * Usage: PB_URL=https://detailing-pb.fly.dev PB_EMAIL=... PB_PASSWORD=... node scripts/purge-all-data.mjs
 */

const PB_URL = (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090').replace(/\/$/, '')
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD

async function auth() {
  if (!PB_EMAIL || !PB_PASSWORD) {
    console.error('Set PB_EMAIL and PB_PASSWORD')
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
  return { Authorization: `Bearer ${token}` }
}

async function listAll(collection, headers) {
  const items = []
  let page = 1
  while (true) {
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=200&page=${page}`, { headers })
    if (!res.ok) throw new Error(`List ${collection} failed: ${await res.text()}`)
    const data = await res.json()
    items.push(...data.items)
    if (page >= data.totalPages) break
    page++
  }
  return items
}

async function deleteRecord(collection, id, headers) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error(`Delete ${collection}/${id}: ${await res.text()}`)
}

async function clearCollection(collection, headers) {
  const items = await listAll(collection, headers)
  for (const item of items) {
    await deleteRecord(collection, item.id, headers)
  }
  return items.length
}

async function main() {
  console.log(`Purging all data from ${PB_URL} ...`)
  const headers = await auth()

  const order = [
    'invoices',
    'jobs',
    'notifications_log',
    'clients',
    'overhead_expenses',
    'business_expenses',
    'equipment',
    'supplies',
    'packages',
    'app_settings',
  ]

  for (const name of order) {
    try {
      const n = await clearCollection(name, headers)
      console.log(`  ${name}: deleted ${n}`)
    } catch (err) {
      console.warn(`  ${name}: ${err.message}`)
    }
  }

  console.log('Done. PocketBase is empty.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
