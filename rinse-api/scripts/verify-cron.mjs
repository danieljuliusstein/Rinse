#!/usr/bin/env node
/**
 * Smoke-test notification cron auth against a deployed Next.js app.
 * Usage:
 *   APP_URL=https://your-app.vercel.app CRON_SECRET=... node scripts/verify-cron.mjs
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

const APP_URL = (process.env.APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const SECRET = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET

async function probe(label, headers) {
  const res = await fetch(`${APP_URL}/api/cron/notifications`, { headers })
  const body = await res.text()
  console.log(`${label}: HTTP ${res.status}${body ? ` — ${body.slice(0, 120)}` : ''}`)
  return res.ok
}

async function main() {
  console.log(`Testing cron at ${APP_URL}/api/cron/notifications\n`)

  const unauth = await probe('No auth', {})
  if (unauth) {
    console.error('\nFAIL: cron accepted unauthenticated request in production-like mode')
    process.exit(1)
  }

  if (!SECRET) {
    console.warn('\nSKIP: CRON_SECRET not set — cannot test authenticated cron')
    process.exit(0)
  }

  const viaHeader = await probe('x-api-secret', { 'x-api-secret': SECRET })
  const viaBearer = await probe('Authorization Bearer', { Authorization: `Bearer ${SECRET}` })

  if (viaHeader || viaBearer) {
    console.log('\nOK: cron auth works')
    process.exit(0)
  }

  console.error('\nFAIL: cron rejected valid secret — check CRON_SECRET on Vercel')
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
