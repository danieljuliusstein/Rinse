#!/usr/bin/env node
/**
 * Seed default packages into PocketBase for a specific organization.
 * Usage:
 *   ORG_SLUG=atlas-detailing PB_URL=... PB_EMAIL=... PB_PASSWORD=... node scripts/seed-packages.mjs
 */

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD
const ORG_SLUG = process.env.ORG_SLUG?.trim()

const PACKAGES = [
  { name: 'Basic Wash', base_price: 80, active: true, description: 'Exterior wash and dry', duration_minutes: 90 },
  { name: 'Full Detail', base_price: 320, active: true, description: 'Interior + exterior full detail', duration_minutes: 240 },
  { name: 'Paint Correction', base_price: 450, active: true, description: 'Single-stage paint correction', duration_minutes: 300 },
  { name: 'Ceramic Coat', base_price: 800, active: true, description: 'Ceramic coating application', duration_minutes: 360 },
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

  let orgId = null
  if (ORG_SLUG) {
    const orgRes = await fetch(
      `${PB_URL}/api/collections/organizations/records?filter=${encodeURIComponent(`slug = "${ORG_SLUG.replace(/"/g, '\\"')}"`)}&perPage=1`,
      { headers }
    )
    const orgData = await orgRes.json()
    orgId = orgData.items?.[0]?.id ?? null
    if (!orgId) {
      console.error(`Organization not found for slug: ${ORG_SLUG}`)
      process.exit(1)
    }
    console.log(`Seeding packages for org: ${ORG_SLUG} (${orgId})`)
  }

  const filter = orgId ? `organization_id = "${orgId}"` : ''
  const listUrl = filter
    ? `${PB_URL}/api/collections/packages/records?perPage=200&filter=${encodeURIComponent(filter)}`
    : `${PB_URL}/api/collections/packages/records?perPage=200`
  const listRes = await fetch(listUrl, { headers })
  const list = await listRes.json()
  const existing = new Set((list.items ?? []).map((p) => String(p.name).toLowerCase()))

  let created = 0
  for (const pkg of PACKAGES) {
    if (existing.has(pkg.name.toLowerCase())) {
      console.log('Exists:', pkg.name)
      continue
    }
    const body = orgId ? { ...pkg, organization_id: orgId } : pkg
    const res = await fetch(`${PB_URL}/api/collections/packages/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.error('Failed to create package:', pkg.name, await res.text())
      process.exit(1)
    }
    console.log('Created:', pkg.name)
    created++
  }

  console.log(`Done — ${created} package(s) added.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
