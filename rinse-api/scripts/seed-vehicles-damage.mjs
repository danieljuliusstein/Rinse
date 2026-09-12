#!/usr/bin/env node
/**
 * Seed placeholder vehicles + pre-existing damage records into PocketBase.
 * Usage: npm run seed:vehicles-damage
 * Idempotent — skips vehicles that already exist (matched by plate).
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

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD

/** Placeholder profiles — matched to client name (case-insensitive substring). */
const PROFILES = [
  {
    match: /sarah/i,
    vehicle: {
      year: 2022,
      make: 'Tesla',
      model: 'Model 3',
      color: 'Midnight Blue',
      color_hex: '#1a3a6a',
      plate: 'DX91AB',
      vin: '5YJ3E1EA1JF123456',
      type: 'sedan',
    },
    damages: [
      {
        area: 'Front bumper',
        note: 'Small paint chip, pre-existing — noted by client at intake',
        date: '2026-06-02',
        captured_at: '2026-06-02T09:14:00.000Z',
      },
      {
        area: 'Driver door',
        note: 'Light surface scratch, approx 4 inches, clear coat only',
        date: '2026-05-15',
        captured_at: '2026-05-15T14:30:00.000Z',
      },
      {
        area: 'Rear quarter panel',
        note: 'Hail pitting, minor. Pre-existing per client.',
        date: '2026-02-14',
        captured_at: '2026-02-14T11:05:00.000Z',
      },
    ],
  },
  {
    match: /marcus/i,
    vehicle: {
      year: 2019,
      make: 'Ford',
      model: 'F-150',
      color: 'Oxford White',
      color_hex: '#e8e8e8',
      plate: 'GA-4821',
      vin: '1FTEW1E51KFA12345',
      type: 'truck',
    },
    damages: [
      {
        area: 'Tailgate',
        note: 'Scuff marks from loading equipment — documented at intake',
        date: '2026-05-28',
        captured_at: '2026-05-28T08:45:00.000Z',
      },
    ],
  },
]

const FALLBACK = {
  vehicle: {
    year: 2022,
    make: 'Tesla',
    model: 'Model 3',
    color: 'Midnight Blue',
    color_hex: '#1a3a6a',
    plate: 'DX91AB',
    vin: '5YJ3E1EA1JF123456',
    type: 'sedan',
  },
  damages: [
    {
      area: 'Front bumper',
      note: 'Small paint chip, pre-existing — noted by client at intake',
      date: '2026-06-02',
      captured_at: '2026-06-02T09:14:00.000Z',
    },
    {
      area: 'Driver door',
      note: 'Light surface scratch, approx 4 inches, clear coat only',
      date: '2026-05-15',
      captured_at: '2026-05-15T14:30:00.000Z',
    },
    {
      area: 'Rear quarter panel',
      note: 'Hail pitting, minor. Pre-existing per client.',
      date: '2026-02-14',
      captured_at: '2026-02-14T11:05:00.000Z',
    },
  ],
}

async function auth() {
  if (!PB_EMAIL || !PB_PASSWORD) {
    console.error('Set PB_EMAIL and PB_PASSWORD (or NEXT_PUBLIC_PB_* in .env.local)')
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

async function listRecords(headers, collection, filter = '') {
  const params = new URLSearchParams({ perPage: '200' })
  if (filter) params.set('filter', filter)
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?${params}`, { headers })
  if (!res.ok) throw new Error(`${collection} list failed: ${await res.text()}`)
  const data = await res.json()
  return data.items ?? []
}

async function createRecord(headers, collection, body) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${collection} create failed: ${await res.text()}`)
  return res.json()
}

function profileForClient(name) {
  return PROFILES.find((p) => p.match.test(name))
}

async function seedClient(headers, client, existingPlates, existingDamageKeys, profile) {
  const vehicleSpec = { ...profile.vehicle }
  if (profile === FALLBACK) {
    vehicleSpec.plate = `DEMO-${client.id.slice(-6).toUpperCase()}`
  }
  const plate = vehicleSpec.plate

  if (existingPlates.has(plate.toLowerCase())) {
    console.log(`Skip vehicle (plate exists): ${plate} — ${client.name}`)
    const vehicles = await listRecords(headers, 'vehicles', `plate = "${plate}"`)
    const vehicleId = vehicles[0]?.id
    if (!vehicleId) return { vehicles: 0, damages: 0 }
    let damages = 0
    for (const d of profile.damages) {
      const key = `${vehicleId}:${d.area}`
      if (existingDamageKeys.has(key)) continue
      await createRecord(headers, 'damage_docs', {
        vehicle_id: vehicleId,
        job_id: '',
        area: d.area,
        note: d.note,
        date: d.date,
        captured_at: d.captured_at,
      })
      existingDamageKeys.add(key)
      damages++
      console.log(`  + damage: ${d.area}`)
    }
    return { vehicles: 0, damages }
  }

  const vehicle = await createRecord(headers, 'vehicles', {
    client_id: client.id,
    ...vehicleSpec,
  })
  existingPlates.add(plate.toLowerCase())
  console.log(`Created vehicle: ${vehicleSpec.year} ${vehicleSpec.make} ${vehicleSpec.model} (${client.name})`)

  let damages = 0
  for (const d of profile.damages) {
    await createRecord(headers, 'damage_docs', {
      vehicle_id: vehicle.id,
      job_id: '',
      area: d.area,
      note: d.note,
      date: d.date,
      captured_at: d.captured_at,
    })
    existingDamageKeys.add(`${vehicle.id}:${d.area}`)
    damages++
    console.log(`  + damage: ${d.area}`)
  }
  return { vehicles: 1, damages }
}

async function main() {
  const headers = await auth()
  const clients = await listRecords(headers, 'clients')
  if (clients.length === 0) {
    console.error('No clients in PocketBase — add a client first.')
    process.exit(1)
  }

  const vehicles = await listRecords(headers, 'vehicles')
  const existingPlates = new Set(
    vehicles.map((v) => String(v.plate ?? '').toLowerCase()).filter(Boolean),
  )

  const damageDocs = await listRecords(headers, 'damage_docs')
  const existingDamageKeys = new Set(
    damageDocs.map((d) => `${d.vehicle_id}:${d.area}`),
  )

  let totalVehicles = 0
  let totalDamages = 0

  const matched = clients.filter((c) => profileForClient(c.name))
  const targets = matched.length > 0 ? matched : clients.slice(0, 3)

  for (const client of targets) {
    const profile = profileForClient(client.name) ?? FALLBACK
    const result = await seedClient(headers, client, existingPlates, existingDamageKeys, profile)
    totalVehicles += result.vehicles
    totalDamages += result.damages
  }

  console.log(`Done — ${totalVehicles} vehicle(s), ${totalDamages} damage record(s) added.`)
  console.log('Open Clients → [client] → Vehicles to view pre-existing damage.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
