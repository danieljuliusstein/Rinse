#!/usr/bin/env node
/**
 * Set kind on existing supplies (idempotent by name).
 * Usage: PB_URL=https://detailing-pb.fly.dev PB_EMAIL=... PB_PASSWORD=... node scripts/migrate-supply-kinds.mjs
 */

const PB_URL = (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090').replace(/\/$/, '')
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD

const KIND_BY_NAME = {
  'car wash soap': 'chemical',
  'interior cleaner': 'chemical',
  'wax / sealant': 'chemical',
  'ceramic coating': 'chemical',
  'microfiber towels': 'consumable',
}

async function main() {
  if (!PB_EMAIL || !PB_PASSWORD) {
    console.error('Set PB_EMAIL and PB_PASSWORD')
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
  if (!listRes.ok) {
    console.error('List supplies failed:', await listRes.text())
    process.exit(1)
  }

  const { items = [] } = await listRes.json()
  let updated = 0

  for (const item of items) {
    const kind = KIND_BY_NAME[String(item.name).toLowerCase()]
    if (!kind || item.kind === kind) continue

    const res = await fetch(`${PB_URL}/api/collections/supplies/records/${item.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ kind }),
    })
    if (!res.ok) {
      console.error('Failed:', item.name, await res.text())
      continue
    }
    console.log('Updated kind:', item.name, '→', kind)
    updated++
  }

  console.log(`Done — ${updated} supply record(s) updated.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
