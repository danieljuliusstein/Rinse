#!/usr/bin/env node
/**
 * Rename legacy "Paint Correct" packages to "Paint Correction".
 * Usage: ORG_SLUG=atlas-detailing PB_URL=... PB_EMAIL=... PB_PASSWORD=... node scripts/backfill-package-names.mjs
 */

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD
const ORG_SLUG = process.env.ORG_SLUG?.trim()
const FROM_NAME = 'Paint Correct'
const TO_NAME = 'Paint Correction'

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

  let filter = `name = "${FROM_NAME.replace(/"/g, '\\"')}"`
  if (ORG_SLUG) {
    const orgRes = await fetch(
      `${PB_URL}/api/collections/organizations/records?filter=${encodeURIComponent(`slug = "${ORG_SLUG.replace(/"/g, '\\"')}"`)}&perPage=1`,
      { headers }
    )
    const orgData = await orgRes.json()
    const orgId = orgData.items?.[0]?.id
    if (!orgId) {
      console.error(`Organization not found: ${ORG_SLUG}`)
      process.exit(1)
    }
    filter = `organization_id = "${orgId}" && name = "${FROM_NAME.replace(/"/g, '\\"')}"`
  }

  const listRes = await fetch(
    `${PB_URL}/api/collections/packages/records?perPage=50&filter=${encodeURIComponent(filter)}`,
    { headers }
  )
  const list = await listRes.json()
  const items = list.items ?? []
  if (items.length === 0) {
    console.log('No packages to rename.')
    return
  }

  for (const pkg of items) {
    const res = await fetch(`${PB_URL}/api/collections/packages/records/${pkg.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: TO_NAME }),
    })
    if (!res.ok) {
      console.error('Failed to rename', pkg.id, await res.text())
      process.exit(1)
    }
    console.log(`Renamed ${pkg.id}: ${FROM_NAME} → ${TO_NAME}`)
  }
  console.log(`Done — ${items.length} package(s) updated.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
