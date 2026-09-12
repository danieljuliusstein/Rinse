#!/usr/bin/env node
/**
 * Backfill org_created platform events for existing tenant organizations.
 *
 * Usage: npm run admin:backfill-events
 */

import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

const PB_URL = (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || '').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD

async function adminAuth() {
  if (!PB_URL) throw new Error('PB_URL not configured')
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD required')

  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Admin auth failed (${res.status})`)
  const data = await res.json()
  return data.token
}

async function pbFetch(token, path, init = {}) {
  const res = await fetch(`${PB_URL}/api${path}`, {
    ...init,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text }
  }
  if (!res.ok) {
    const detail = data.message || text || `HTTP ${res.status}`
    throw new Error(`${path} → ${detail}`)
  }
  return data
}

async function main() {
  const token = await adminAuth()

  let orgs
  try {
    orgs = await pbFetch(token, '/collections/organizations/records?perPage=500&sort=-id')
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }

  const items = orgs.items ?? []
  const tenants = items.filter((org) => org.is_platform_internal !== true)
  let created = 0
  let skipped = 0

  for (const org of tenants) {
    const filter = encodeURIComponent(`type = "org_created" && organization_id = "${org.id}"`)
    const existing = await pbFetch(
      token,
      `/collections/platform_events/records?perPage=1&filter=${filter}`,
    )
    if ((existing.items ?? []).length > 0) {
      skipped++
      continue
    }

    await pbFetch(token, '/collections/platform_events/records', {
      method: 'POST',
      body: JSON.stringify({
        type: 'org_created',
        category: 'product',
        organization_id: org.id,
        detail: `${org.name} (/${org.slug})`,
        metadata: { source: 'backfill', slug: org.slug, created: org.created },
        ...(org.created ? { occurred_at: org.created } : {}),
      }),
    })
    created++
  }

  console.log(`Backfill complete: ${created} org_created events written, ${skipped} skipped (already present).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
