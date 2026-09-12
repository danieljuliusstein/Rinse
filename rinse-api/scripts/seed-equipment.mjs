#!/usr/bin/env node
/**
 * Seed default equipment into PocketBase.
 * Usage: PB_URL=http://127.0.0.1:8090 PB_EMAIL=... PB_PASSWORD=... node scripts/seed-equipment.mjs
 */

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD

const EQUIPMENT = [
  { name: 'DA polisher', purchase_price: 350, status: 'active' },
  { name: 'Vacuum', purchase_price: 180, status: 'active' },
  { name: 'Pressure washer', purchase_price: 420, status: 'active' },
]

async function main() {
  if (!PB_EMAIL || !PB_PASSWORD) {
    console.error('Set PB_EMAIL and PB_PASSWORD (or NEXT_PUBLIC_PB_* env vars)')
    process.exit(1)
  }

  const authRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
  })

  if (!authRes.ok) {
    console.error('Auth failed:', await authRes.text())
    process.exit(1)
  }

  const { token } = await authRes.json()
  const headers = { Authorization: token, 'Content-Type': 'application/json' }

  const listRes = await fetch(`${PB_URL}/api/collections/equipment/records?perPage=200`, { headers })
  if (!listRes.ok) {
    console.error('Equipment collection not found — deploy updated pb_schema first:', await listRes.text())
    process.exit(1)
  }

  const list = await listRes.json()
  const existing = new Set((list.items ?? []).map((e) => String(e.name).toLowerCase()))

  let created = 0
  for (const item of EQUIPMENT) {
    if (existing.has(item.name.toLowerCase())) {
      console.log('Exists:', item.name)
      continue
    }
    const res = await fetch(`${PB_URL}/api/collections/equipment/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item),
    })
    if (!res.ok) {
      console.error('Failed to create equipment:', item.name, await res.text())
      process.exit(1)
    }
    console.log('Created:', item.name)
    created++
  }

  console.log(`Done — ${created} equipment item(s) added.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
