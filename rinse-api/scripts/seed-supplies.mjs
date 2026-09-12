#!/usr/bin/env node
/**
 * Seed default supplies into PocketBase.
 * Usage: PB_URL=http://127.0.0.1:8090 PB_EMAIL=... PB_PASSWORD=... node scripts/seed-supplies.mjs
 */

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD

const SUPPLIES = [
  { name: 'Car wash soap', unit: 'oz', quantity_on_hand: 128, reorder_threshold: 32, cost_per_unit: 0.15, supplier: 'Chemical Guys', kind: 'chemical' },
  { name: 'Microfiber towels', unit: 'each', quantity_on_hand: 24, reorder_threshold: 8, cost_per_unit: 2.5, supplier: 'Amazon', kind: 'consumable' },
  { name: 'Interior cleaner', unit: 'oz', quantity_on_hand: 64, reorder_threshold: 16, cost_per_unit: 0.22, supplier: 'Meguiars', kind: 'chemical' },
  { name: 'Wax / sealant', unit: 'oz', quantity_on_hand: 32, reorder_threshold: 8, cost_per_unit: 1.2, supplier: 'Chemical Guys', kind: 'chemical' },
  { name: 'Ceramic coating', unit: 'oz', quantity_on_hand: 16, reorder_threshold: 4, cost_per_unit: 8.5, supplier: 'Gtechniq', kind: 'chemical' },
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

  const listRes = await fetch(`${PB_URL}/api/collections/supplies/records?perPage=200`, { headers })
  const list = await listRes.json()
  const existing = new Set(
    (list.items ?? []).map((s) => String(s.name).toLowerCase()),
  )

  let created = 0
  for (const item of SUPPLIES) {
    if (existing.has(item.name.toLowerCase())) {
      console.log('Exists:', item.name)
      continue
    }
    const res = await fetch(`${PB_URL}/api/collections/supplies/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item),
    })
    if (!res.ok) {
      console.error('Failed to create supply:', item.name, await res.text())
      process.exit(1)
    }
    console.log('Created:', item.name)
    created++
  }

  console.log(`Done — ${created} supply item(s) added.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
