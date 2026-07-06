#!/usr/bin/env node
/**
 * Full dummy-data seed for PocketBase — every major collection filled out.
 * Downloads open-source placeholder images (Unsplash) to marketing/assets/stock-photos/.
 * Replace those JPGs with your own anytime and re-run.
 *
 * Usage: npm run seed:demo
 *        FORCE_DEMO_PHOTOS=1 npm run seed:demo   # replace job gallery images
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import {
  ensureStockPhotos,
  jobPhotoSet,
  readStockFile,
} from './lib/demo-images.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const marketingDir = join(root, 'marketing')
const stockPhotosDir = join(marketingDir, 'assets', 'stock-photos')
const manifestPath = join(marketingDir, 'demo-manifest.json')

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
const APP_URL = (process.env.APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const ORG_SLUG = (process.env.ORG_SLUG ?? 'atlas-detailing').trim()
const INTERNAL_SECRET =
  process.env.INTERNAL_API_SECRET
const DEMO_BUSINESS_NAME = (process.env.DEMO_BUSINESS_NAME ?? 'Summit Mobile Detail').trim()
const FORCE_DEMO_PHOTOS = process.env.FORCE_DEMO_PHOTOS === '1'

const DEMO_TAG = 'demo-seed'

const DEMO_SCHEDULE = {
  work_days: [1, 2, 3, 4, 5, 6],
  start_time: '08:00',
  end_time: '18:00',
  lunch_start: '12:00',
  lunch_end: '13:00',
  slot_interval_minutes: 120,
}

const TRAVEL_RATE_PER_MILE = 0.67

const PACKAGE_SPECS = [
  {
    name: 'Basic Wash',
    base_price: 80,
    duration_minutes: 90,
    expected_return_days: 30,
    description: 'Exterior wash, wheels, and tire dressing',
    default_supplies: [
      { supply: 'car wash soap', qty: 4 },
      { supply: 'microfiber towels', qty: 2 },
    ],
  },
  {
    name: 'Full Detail',
    base_price: 320,
    duration_minutes: 240,
    expected_return_days: 90,
    description: 'Interior + exterior full detail with vacuum and protectant',
    default_supplies: [
      { supply: 'car wash soap', qty: 8 },
      { supply: 'interior cleaner', qty: 6 },
      { supply: 'microfiber towels', qty: 4 },
    ],
  },
  {
    name: 'Paint Correction',
    base_price: 450,
    duration_minutes: 300,
    expected_return_days: 180,
    description: 'Single-stage paint correction and sealant',
    default_supplies: [
      { supply: 'car wash soap', qty: 6 },
      { supply: 'wax / sealant', qty: 4 },
      { supply: 'microfiber towels', qty: 6 },
    ],
  },
  {
    name: 'Ceramic Coat',
    base_price: 800,
    duration_minutes: 360,
    expected_return_days: 365,
    description: 'Paint prep + ceramic coating application',
    default_supplies: [
      { supply: 'ceramic coating', qty: 8 },
      { supply: 'microfiber towels', qty: 4 },
    ],
  },
]

const CLIENT_SPECS = [
  {
    key: 'marcus',
    name: 'Marcus Thompson',
    phone: '(555) 234-8901',
    email: 'marcus.t@email.com',
    address: '1420 Peachtree St NE, Atlanta, GA 30309',
    lead_source: 'referral',
    tags: ['repeat', 'vip'],
    notes: 'Fleet owner — prefers Saturday mornings. Always tips well.',
  },
  {
    key: 'sarah',
    name: 'Sarah K.',
    phone: '(555) 876-5432',
    email: 'sarah.k@email.com',
    address: '245 N Highland Ave NE, Atlanta, GA 30307',
    lead_source: 'google',
    tags: ['repeat'],
    notes: 'Model 3 owner. Books every 90 days for Full Detail.',
  },
  {
    key: 'james',
    name: 'James R.',
    phone: '(555) 111-2233',
    email: 'james.r@email.com',
    address: '88 Keys Ferry Rd, McDonough, GA 30253',
    lead_source: 'instagram',
    tags: ['new'],
    notes: 'Found us on Instagram. Interested in paint correction.',
  },
]

const VEHICLE_SPECS = [
  {
    key: 'marcus_truck',
    clientKey: 'marcus',
    year: 2019,
    make: 'Ford',
    model: 'F-150',
    color: 'Oxford White',
    color_hex: '#e8e8e8',
    plate: 'GA-4821',
    vin: '1FTEW1E51KFA12345',
    type: 'truck',
    photoFile: '07-vehicle-truck.jpg',
  },
  {
    key: 'sarah_tesla',
    clientKey: 'sarah',
    year: 2022,
    make: 'Tesla',
    model: 'Model 3',
    color: 'Midnight Blue',
    color_hex: '#1a3a6a',
    plate: 'DX91AB',
    vin: '5YJ3E1EA1JF123456',
    type: 'sedan',
    photoFile: '06-vehicle-sedan.jpg',
  },
]

const DAMAGE_SPECS = [
  {
    key: 'dmg_bumper',
    vehicleKey: 'sarah_tesla',
    area: 'Front bumper',
    note: 'Small paint chip, pre-existing — noted by client at intake',
    dateOffset: -25,
    photoFile: '05-damage-scratch.jpg',
  },
  {
    key: 'dmg_door',
    vehicleKey: 'sarah_tesla',
    area: 'Driver door',
    note: 'Light surface scratch, approx 4 inches, clear coat only',
    dateOffset: -40,
    photoFile: '05-damage-scratch.jpg',
  },
  {
    key: 'dmg_tailgate',
    vehicleKey: 'marcus_truck',
    area: 'Tailgate',
    note: 'Scuff marks from loading equipment — documented at intake',
    dateOffset: -30,
    photoFile: '05-damage-scratch.jpg',
  },
]

const JOB_SPECS = [
  {
    role: 'in_progress',
    dateOffset: 0,
    start_time: '09:00',
    clientKey: 'marcus',
    packageName: 'Full Detail',
    vehicle_type: 'truck',
    status: 'in_progress',
    revenue: 320,
    tip: 0,
    hours_worked: 1.5,
    travel_cost: 18.76,
    marketing_cost: 5,
    equipment_depreciation: 8,
    expenses: [{ category: 'travel', description: '28 mi round trip', amount: 18.76 }],
    uploadPhotos: true,
    photoCount: 1,
  },
  {
    role: 'scheduled_today',
    dateOffset: 0,
    start_time: '10:00',
    clientKey: 'sarah',
    packageName: 'Full Detail',
    vehicle_type: 'suv',
    status: 'scheduled',
    revenue: 320,
    travel_cost: 0,
    notes: 'Blocks 10:00 booking slot (4h service)',
  },
  {
    role: 'invoiced',
    dateOffset: -2,
    start_time: '14:00',
    clientKey: 'sarah',
    packageName: 'Basic Wash',
    vehicle_type: 'sedan',
    location_type: 'fixed',
    status: 'invoiced',
    revenue: 80,
    hours_worked: 2,
    marketing_cost: 2,
    invoiceRole: 'sent',
    expenses: [{ category: 'supplies', description: 'Soap + towels', amount: 6.5 }],
  },
  {
    role: 'scheduled_tomorrow',
    dateOffset: 1,
    start_time: '10:00',
    clientKey: 'james',
    packageName: 'Paint Correction',
    vehicle_type: 'suv',
    status: 'scheduled',
    revenue: 450,
    notes: 'Confirm address gate code before arrival',
  },
  {
    role: 'completed_photos',
    dateOffset: -5,
    start_time: '09:00',
    clientKey: 'marcus',
    packageName: 'Ceramic Coat',
    vehicle_type: 'sedan',
    status: 'paid',
    revenue: 800,
    tip: 50,
    hours_worked: 4,
    travel_cost: 15,
    marketing_cost: 0,
    equipment_depreciation: 12,
    expenses: [{ category: 'supplies', description: 'Ceramic supplies', amount: 120 }],
    supplies_used: [{ supply: 'ceramic coating', qty: 8 }],
    invoiceRole: 'paid',
    uploadPhotos: true,
    photoCount: 4,
  },
]

const LEAD_SPECS = [
  {
    role: 'lead_inquiry',
    name: 'Alex M.',
    phone: '(555) 444-7788',
    email: 'alex@email.com',
    source: 'website',
    vehicle_type: 'suv',
    packageName: 'Full Detail',
    service_interest: 'Full detail — dog hair in cargo area',
    quote_amount: 320,
    stage: 'inquiry',
    notes: 'Submitted via booking page. Wants quote before scheduling.',
  },
  {
    role: 'lead_quoted',
    name: 'Taylor R.',
    phone: '(555) 222-9911',
    email: 'taylor.r@email.com',
    source: 'google',
    vehicle_type: 'sedan',
    packageName: 'Paint Correction',
    service_interest: 'Swirl marks on black sedan',
    quote_amount: 450,
    stage: 'quoted',
    clientKey: 'sarah',
    notes: 'Sent quote link — follow up Thursday.',
  },
]

const SUPPLY_SPECS = [
  {
    name: 'Car wash soap',
    unit: 'oz',
    quantity_on_hand: 128,
    reorder_threshold: 32,
    cost_per_unit: 0.15,
    supplier: 'Chemical Guys',
    kind: 'chemical',
    notes: 'Honeydew snow foam — bulk refill',
  },
  {
    name: 'Microfiber towels',
    unit: 'each',
    quantity_on_hand: 24,
    reorder_threshold: 8,
    cost_per_unit: 2.5,
    supplier: 'Amazon',
    kind: 'consumable',
    notes: '16x16 edgeless, grey',
  },
  {
    name: 'Interior cleaner',
    unit: 'oz',
    quantity_on_hand: 64,
    reorder_threshold: 16,
    cost_per_unit: 0.22,
    supplier: 'Meguiars',
    kind: 'chemical',
    notes: 'All-surface interior',
  },
  {
    name: 'Wax / sealant',
    unit: 'oz',
    quantity_on_hand: 32,
    reorder_threshold: 8,
    cost_per_unit: 1.2,
    supplier: 'Chemical Guys',
    kind: 'chemical',
    notes: 'HydroSlick ceramic wax',
  },
  {
    name: 'Ceramic coating',
    unit: 'oz',
    quantity_on_hand: 3,
    reorder_threshold: 4,
    cost_per_unit: 8.5,
    supplier: 'Gtechniq',
    kind: 'chemical',
    notes: 'EXOv5 — low stock alert demo',
    photoFile: '08-supply-bottles.jpg',
  },
]

const EQUIPMENT_SPECS = [
  {
    key: 'polisher',
    name: 'DA polisher',
    purchase_price: 350,
    purchase_date: '2024-03-15',
    supplier: 'Harbor Freight',
    status: 'active',
    notes: 'Bauer 20V — primary paint correction tool',
    photoFile: '08-supply-bottles.jpg',
  },
  {
    key: 'vacuum',
    name: 'Shop vacuum',
    purchase_price: 180,
    purchase_date: '2023-11-02',
    supplier: 'Home Depot',
    status: 'active',
    notes: '6 gal wet/dry with HEPA filter',
    photoFile: '08-supply-bottles.jpg',
  },
  {
    key: 'pressure',
    name: 'Pressure washer',
    purchase_price: 420,
    purchase_date: '2024-06-01',
    supplier: 'Ryobi',
    status: 'active',
    notes: '1800 PSI electric — mobile setup',
    photoFile: '08-supply-bottles.jpg',
  },
]

const OVERHEAD_SPECS = [
  { key: 'van', name: 'Van payment', amount: 450, category: 'vehicle', billing_cycle: 'monthly', notes: 'Sprinter lease' },
  { key: 'ins', name: 'Business insurance', amount: 120, category: 'insurance', billing_cycle: 'monthly' },
  { key: 'soft', name: 'Scheduling software', amount: 29, category: 'software', billing_cycle: 'monthly' },
  {
    key: 'polish',
    name: 'Polisher replacement fund',
    amount: 350,
    category: 'equipment',
    billing_cycle: 'one_time',
    next_due: '2026-09-01',
    notes: 'Budget for backup DA polisher',
  },
]

const BUSINESS_EXPENSE_SPECS = [
  {
    key: 'marketing_fb',
    dateOffset: -7,
    name: 'Facebook ads',
    amount: 75,
    category: 'marketing',
    vendor: 'Meta',
    notes: 'Local radius boost — March campaign',
  },
  {
    key: 'supplies_run',
    dateOffset: -3,
    name: 'Supply restock run',
    amount: 142.5,
    category: 'supplies',
    vendor: 'Chemical Guys',
    notes: 'Soap, towels, interior cleaner',
  },
]

const QUOTE_SPECS = [
  {
    key: 'quote_james',
    clientKey: 'james',
    packageName: 'Paint Correction',
    vehicle_type: 'suv',
    location_type: 'mobile',
    dateOffset: 3,
    subtotal: 450,
    status: 'sent',
    notes: 'Single-stage correction quote — sent via text',
  },
]

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(iso, days) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function nextSunday(fromIso) {
  const d = new Date(fromIso + 'T12:00:00')
  const day = d.getDay()
  const delta = day === 0 ? 7 : 7 - day
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function escapeFilter(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function demoNote(role, extra = '') {
  const base = `${DEMO_TAG}:${role}`
  return extra ? `${base} — ${extra}` : base
}

function matchDemoNote(notes, role) {
  return String(notes ?? '').includes(`${DEMO_TAG}:${role}`)
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
  const data = await res.json()
  return {
    headers: { Authorization: data.token, 'Content-Type': 'application/json' },
    orgId: data.record?.organization_id,
  }
}

async function listRecords(headers, collection, filter = '') {
  const params = new URLSearchParams({ perPage: '200' })
  if (filter) params.set('filter', filter)
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?${params}`, { headers })
  if (!res.ok) {
    const text = await res.text()
    if (res.status === 404 && text.includes('Missing collection')) return null
    throw new Error(`${collection} list failed: ${text}`)
  }
  return (await res.json()).items ?? []
}

async function getRecord(headers, collection, id) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, { headers })
  if (!res.ok) return null
  return res.json()
}

async function patchRecord(headers, collection, id, body, isForm = false) {
  const h = { Authorization: headers.Authorization }
  let payload = body
  if (!isForm) {
    h['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers: h,
    body: payload,
  })
  if (!res.ok) throw new Error(`${collection} patch failed: ${await res.text()}`)
  return res.json()
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

async function resolveOrgId(headers) {
  const orgs = await listRecords(headers, 'organizations', `slug = "${escapeFilter(ORG_SLUG)}"`)
  const orgId = orgs[0]?.id
  if (!orgId) {
    console.error(`Organization not found for slug: ${ORG_SLUG}`)
    process.exit(1)
  }
  return orgId
}

function packageIdFor(packages, name) {
  const id = packages[String(name).toLowerCase()]
  if (!id) throw new Error(`Package not found: ${name}`)
  return id
}

function supplyIdFor(supplies, name) {
  const id = supplies[String(name).toLowerCase()]
  if (!id) return ''
  return id
}

async function uploadFileField(headers, collection, id, fieldName, buffer, filename) {
  const form = new FormData()
  const type = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
  form.append(fieldName, new Blob([buffer], { type }), filename)
  return patchRecord(headers, collection, id, form, true)
}

async function seedSettings(headers, orgId) {
  const rows = await listRecords(headers, 'app_settings', `organization_id = "${escapeFilter(orgId)}"`)
  if (!rows.length) {
    console.warn('No app_settings row — create one in the app first')
    return null
  }
  const row = rows[0]
  const body = {
    business_name: DEMO_BUSINESS_NAME,
    business_phone: '(404) 555-0142',
    business_email: 'hello@summitdetail.demo',
    business_address: '1200 West Peachtree St NW, Atlanta, GA 30309',
    invoice_terms_footer: 'Thank you for your business! Payment due upon receipt.',
    accent_color: '#4caf50',
    booking_schedule: DEMO_SCHEDULE,
    travel_rate_per_mile: TRAVEL_RATE_PER_MILE,
    track_job_supplies: true,
    notifications: {
      job_reminder: true,
      morning_reminder: true,
      follow_up: true,
      invoice_overdue: true,
      low_inventory: true,
    },
    auto_messages: {
      booking_confirmation: true,
      day_before_reminder: true,
      thank_you_after_job: true,
    },
  }
  await patchRecord(headers, 'app_settings', row.id, body)

  const logo = readStockFile(stockPhotosDir, '09-logo-placeholder.jpg')
  if (logo) {
    await uploadFileField(headers, 'app_settings', row.id, 'logo', logo.buffer, logo.filename)
    console.log('  + logo placeholder')
  }
  console.log(`Updated app_settings: ${DEMO_BUSINESS_NAME}`)
  return row.id
}

async function seedPackages(headers, orgId, supplyIds) {
  const existing = await listRecords(headers, 'packages', `organization_id = "${escapeFilter(orgId)}"`)
  const byName = new Map(existing.map((p) => [String(p.name).toLowerCase(), p]))
  const ids = {}

  for (const spec of PACKAGE_SPECS) {
    const key = spec.name.toLowerCase()
    const default_supplies = spec.default_supplies
      .map((d) => ({ supply_id: supplyIdFor(supplyIds, d.supply), default_qty: d.qty }))
      .filter((d) => d.supply_id)

    const payload = {
      organization_id: orgId,
      name: spec.name,
      base_price: spec.base_price,
      duration_minutes: spec.duration_minutes,
      expected_return_days: spec.expected_return_days,
      description: spec.description,
      default_supplies,
      active: true,
    }

    const found = byName.get(key)
    if (found) {
      await patchRecord(headers, 'packages', found.id, payload)
      ids[key] = found.id
      continue
    }
    const created = await createRecord(headers, 'packages', payload)
    ids[key] = created.id
    console.log(`  + package: ${spec.name}`)
  }
  return ids
}

async function seedClients(headers, orgId) {
  const existing = await listRecords(headers, 'clients', `organization_id = "${escapeFilter(orgId)}"`)
  const ids = {}

  for (const spec of CLIENT_SPECS) {
    const found =
      existing.find((c) => matchDemoNote(c.notes, `client_${spec.key}`)) ||
      existing.find((c) => new RegExp(spec.key, 'i').test(String(c.name ?? '')))

    const payload = {
      organization_id: orgId,
      name: spec.name,
      phone: spec.phone,
      email: spec.email,
      address: spec.address,
      lead_source: spec.lead_source,
      tags: spec.tags,
      notes: demoNote(`client_${spec.key}`, spec.notes),
    }

    if (found) {
      await patchRecord(headers, 'clients', found.id, payload)
      ids[spec.key] = found.id
    } else {
      const created = await createRecord(headers, 'clients', payload)
      ids[spec.key] = created.id
      console.log(`  + client: ${spec.name}`)
    }
  }
  return ids
}

async function seedSupplies(headers, orgId) {
  const existing = await listRecords(headers, 'supplies', `organization_id = "${escapeFilter(orgId)}"`)
  const byName = new Map(existing.map((s) => [String(s.name).toLowerCase(), s]))
  const ids = {}

  for (const spec of SUPPLY_SPECS) {
    const key = spec.name.toLowerCase()
    const { photoFile, ...fields } = spec
    const payload = { organization_id: orgId, ...fields }

    let record = byName.get(key)
    if (record) {
      await patchRecord(headers, 'supplies', record.id, payload)
    } else {
      record = await createRecord(headers, 'supplies', payload)
      console.log(`  + supply: ${spec.name}`)
    }
    ids[key] = record.id

    if (photoFile) {
      const img = readStockFile(stockPhotosDir, photoFile)
      if (img) {
        await uploadFileField(headers, 'supplies', record.id, 'photo', img.buffer, img.filename)
      }
    }
  }
  return ids
}

async function seedEquipment(headers, orgId) {
  const existing = await listRecords(headers, 'equipment', `organization_id = "${escapeFilter(orgId)}"`)
  const ids = {}

  for (const spec of EQUIPMENT_SPECS) {
    let row = existing.find((e) => matchDemoNote(e.notes, spec.key))
    const { photoFile, ...fields } = spec
    const payload = {
      organization_id: orgId,
      name: fields.name,
      purchase_price: fields.purchase_price,
      purchase_date: fields.purchase_date,
      supplier: fields.supplier,
      status: fields.status,
      notes: demoNote(spec.key, fields.notes),
    }
    if (row) {
      await patchRecord(headers, 'equipment', row.id, payload)
    } else {
      row = await createRecord(headers, 'equipment', payload)
      console.log(`  + equipment: ${spec.name}`)
    }
    ids[spec.key] = row.id

    if (photoFile) {
      const img = readStockFile(stockPhotosDir, photoFile)
      if (img) {
        await uploadFileField(headers, 'equipment', row.id, 'photo', img.buffer, img.filename)
      }
    }
  }
  return ids
}

async function seedOverhead(headers, orgId) {
  const existing = await listRecords(headers, 'overhead_expenses', `organization_id = "${escapeFilter(orgId)}"`)
  for (const spec of OVERHEAD_SPECS) {
    let row = existing.find((e) => matchDemoNote(e.notes, spec.key))
    const payload = {
      organization_id: orgId,
      name: spec.name,
      amount: spec.amount,
      category: spec.category,
      billing_cycle: spec.billing_cycle,
      next_due: spec.next_due ?? '',
      notes: demoNote(spec.key, spec.notes ?? ''),
    }
    if (row) {
      await patchRecord(headers, 'overhead_expenses', row.id, payload)
    } else {
      await createRecord(headers, 'overhead_expenses', payload)
      console.log(`  + overhead: ${spec.name}`)
    }
  }
}

async function seedBusinessExpenses(headers, orgId) {
  const today = isoToday()
  const existing = await listRecords(headers, 'business_expenses', `organization_id = "${escapeFilter(orgId)}"`)
  for (const spec of BUSINESS_EXPENSE_SPECS) {
    const date = addDays(today, spec.dateOffset)
    let row = existing.find((e) => matchDemoNote(e.notes, spec.key))
    const payload = {
      organization_id: orgId,
      date,
      name: spec.name,
      amount: spec.amount,
      category: spec.category,
      vendor: spec.vendor ?? '',
      notes: demoNote(spec.key, spec.notes),
    }
    if (row) {
      await patchRecord(headers, 'business_expenses', row.id, payload)
    } else {
      await createRecord(headers, 'business_expenses', payload)
      console.log(`  + expense: ${spec.name}`)
    }
  }
}

async function seedVehicles(headers, orgId, clients) {
  const existing = await listRecords(
    headers,
    'vehicles',
    `organization_id = "${escapeFilter(orgId)}"`,
  )
  const ids = {}

  for (const spec of VEHICLE_SPECS) {
    let row = existing.find((v) => v.plate === spec.plate)
    const payload = {
      organization_id: orgId,
      client_id: clients[spec.clientKey],
      year: spec.year,
      make: spec.make,
      model: spec.model,
      color: spec.color,
      color_hex: spec.color_hex,
      plate: spec.plate,
      vin: spec.vin,
      type: spec.type,
    }
    if (row) {
      await patchRecord(headers, 'vehicles', row.id, payload)
    } else {
      row = await createRecord(headers, 'vehicles', payload)
      console.log(`  + vehicle: ${spec.year} ${spec.make} ${spec.model}`)
    }
    ids[spec.key] = row.id

    if (spec.photoFile) {
      const img = readStockFile(stockPhotosDir, spec.photoFile)
      if (img) {
        await uploadFileField(headers, 'vehicles', row.id, 'photo', img.buffer, img.filename)
      }
    }
  }
  return ids
}

async function seedDamage(headers, orgId, vehicles) {
  const today = isoToday()
  const existing = await listRecords(
    headers,
    'damage_docs',
    `organization_id = "${escapeFilter(orgId)}"`,
  )
  if (existing === null) return

  for (const spec of DAMAGE_SPECS) {
    const vehicleId = vehicles[spec.vehicleKey]
    if (!vehicleId) continue
    const date = addDays(today, spec.dateOffset)
    let row = existing.find(
      (d) => d.vehicle_id === vehicleId && matchDemoNote(d.note, spec.key),
    )
    const note = demoNote(spec.key, spec.note)
    const payload = {
      organization_id: orgId,
      vehicle_id: vehicleId,
      job_id: '',
      area: spec.area,
      note,
      date,
      captured_at: `${date}T09:00:00.000Z`,
    }
    if (row) {
      await patchRecord(headers, 'damage_docs', row.id, payload)
    } else {
      row = await createRecord(headers, 'damage_docs', payload)
      console.log(`  + damage: ${spec.area}`)
    }
    if (spec.photoFile) {
      const img = readStockFile(stockPhotosDir, spec.photoFile)
      if (img) {
        await uploadFileField(headers, 'damage_docs', row.id, 'photo', img.buffer, img.filename)
      }
    }
  }
}

async function seedTimeBlocks(headers, orgId) {
  const today = isoToday()
  const templates = [
    { date: nextSunday(today), all_day: true, label: 'Day off', role: 'day_off' },
    { date: addDays(today, 4), all_day: false, start_time: '14:00', end_time: '17:00', label: 'Dentist', role: 'dentist' },
  ]
  const existing = await listRecords(headers, 'time_blocks', `organization_id = "${escapeFilter(orgId)}"`)
  if (existing === null) return

  for (const block of templates) {
    const key = `${block.date}:${block.label}`
    if (existing.some((b) => `${b.date}:${b.label}` === key)) continue
    await createRecord(headers, 'time_blocks', {
      organization_id: orgId,
      date: block.date,
      all_day: block.all_day,
      start_time: block.all_day ? '' : block.start_time,
      end_time: block.all_day ? '' : block.end_time,
      label: block.label,
    })
    console.log(`  + time off: ${block.label}`)
  }
}

async function seedJobs(headers, orgId, packages, clients, supplyIds) {
  const today = isoToday()
  const existing = await listRecords(headers, 'jobs', `organization_id = "${escapeFilter(orgId)}"`)
  const jobs = {}

  for (const spec of JOB_SPECS) {
    const date = addDays(today, spec.dateOffset)
    let job = existing.find((j) => matchDemoNote(j.notes, spec.role))

    const supplies_used = (spec.supplies_used ?? []).map((s) => ({
      supply_id: supplyIdFor(supplyIds, s.supply),
      quantity_used: s.qty,
    })).filter((s) => s.supply_id)

    const body = {
      organization_id: orgId,
      date,
      start_time: spec.start_time ?? '',
      location_type: spec.location_type ?? 'mobile',
      package_id: packageIdFor(packages, spec.packageName),
      vehicle_type: spec.vehicle_type,
      client_id: clients[spec.clientKey],
      status: spec.status,
      revenue: spec.revenue,
      tip: spec.tip ?? 0,
      hours_worked: spec.hours_worked ?? 0,
      travel_cost: spec.travel_cost ?? 0,
      marketing_cost: spec.marketing_cost ?? 0,
      equipment_depreciation: spec.equipment_depreciation ?? 0,
      expenses: spec.expenses ?? [],
      supplies_used,
      notes: demoNote(spec.role, spec.notes ?? ''),
    }

    if (job) {
      await patchRecord(headers, 'jobs', job.id, body)
      job = { ...job, ...body, id: job.id }
      console.log(`  ~ job: ${spec.role}`)
    } else {
      job = await createRecord(headers, 'jobs', body)
      console.log(`  + job: ${spec.role}`)
    }
    jobs[spec.role] = job
  }
  return jobs
}

async function clearJobPhotos(headers, jobId) {
  const job = await getRecord(headers, 'jobs', jobId)
  const photos = job?.photos ?? []
  if (!photos.length) return
  const form = new FormData()
  for (const fn of photos) form.append('photos-', fn)
  await patchRecord(headers, 'jobs', jobId, form, true)
}

async function uploadJobPhotos(headers, jobId, count = 4) {
  const job = await getRecord(headers, 'jobs', jobId)
  const existing = job?.photos?.length ?? 0
  if (existing >= count && !FORCE_DEMO_PHOTOS) {
    console.log(`  skip photos (${existing} already on job)`)
    return
  }
  if (existing > 0 && FORCE_DEMO_PHOTOS) {
    await clearJobPhotos(headers, jobId)
  }

  const photos = jobPhotoSet(stockPhotosDir).slice(0, count)
  if (!photos.length) {
    console.warn('  no stock photos available')
    return
  }

  const photoMeta = []
  let lastRecord = job
  for (const p of photos) {
    const form = new FormData()
    form.append('photos+', new Blob([p.buffer], { type: 'image/jpeg' }), p.filename)
    lastRecord = await patchRecord(headers, 'jobs', jobId, form, true)
    const filenames = lastRecord.photos ?? []
    const fn = filenames[filenames.length - 1]
    if (fn) photoMeta.push({ filename: fn, type: p.type })
  }

  if (photoMeta.length) {
    await patchRecord(headers, 'jobs', jobId, { photo_meta: photoMeta })
  }
  console.log(`  + ${photoMeta.length} job photo(s) with before/after labels`)
}

async function seedInvoices(headers, orgId, jobs, clients) {
  const invoices = {}
  const existing = await listRecords(headers, 'invoices', `organization_id = "${escapeFilter(orgId)}"`)

  const paidJob = jobs.completed_photos
  const paidDate = paidJob.date
  let paidInv = existing.find((i) => i.job_id === paidJob.id)
  if (!paidInv) {
    paidInv = await createRecord(headers, 'invoices', {
      organization_id: orgId,
      invoice_number: `DEMO-PAID-${paidDate.replace(/-/g, '')}`,
      job_id: paidJob.id,
      client_id: clients.marcus,
      subtotal: 800,
      tip: 50,
      total: 850,
      status: 'paid',
      payments: [{ amount: 850, method: 'Venmo', date: paidDate }],
      amount_paid: 850,
      balance_due: 0,
      paid_at: `${paidDate}T17:00:00.000Z`,
      terms: 'Due on receipt',
    })
    console.log('  + invoice: paid')
  }
  await patchRecord(headers, 'jobs', paidJob.id, { invoice_id: paidInv.id, status: 'paid' })
  invoices.paid = paidInv

  const invoicedJob = jobs.invoiced
  let sentInv = existing.find((i) => i.job_id === invoicedJob.id)
  if (!sentInv) {
    sentInv = await createRecord(headers, 'invoices', {
      organization_id: orgId,
      invoice_number: `DEMO-SENT-${invoicedJob.date.replace(/-/g, '')}`,
      job_id: invoicedJob.id,
      client_id: clients.sarah,
      subtotal: 80,
      tip: 0,
      total: 80,
      status: 'sent',
      payments: [],
      amount_paid: 0,
      balance_due: 80,
      sent_at: `${invoicedJob.date}T12:00:00.000Z`,
      terms: 'Net 7 — thank you!',
    })
    console.log('  + invoice: sent')
  }
  await patchRecord(headers, 'jobs', invoicedJob.id, { invoice_id: sentInv.id, status: 'invoiced' })
  invoices.sent = sentInv

  return invoices
}

async function seedQuotes(headers, orgId, packages, clients, leads) {
  const existing = await listRecords(headers, 'quotes', `organization_id = "${escapeFilter(orgId)}"`)
  if (existing === null) return {}

  const today = isoToday()
  const quotes = {}

  for (const spec of QUOTE_SPECS) {
    let row = existing.find((q) => matchDemoNote(q.notes, spec.key))
    const clientId = spec.clientKey ? clients[spec.clientKey] : ''
    const date = addDays(today, spec.dateOffset)
    const payload = {
      organization_id: orgId,
      quote_number: row?.quote_number ?? `DEMO-Q-${spec.key.toUpperCase()}`,
      client_id: clientId,
      package_id: packageIdFor(packages, spec.packageName),
      vehicle_type: spec.vehicle_type,
      location_type: spec.location_type,
      date,
      subtotal: spec.subtotal,
      status: spec.status,
      valid_until: addDays(today, 30),
      notes: demoNote(spec.key, spec.notes),
    }
    if (row) {
      await patchRecord(headers, 'quotes', row.id, payload)
    } else {
      row = await createRecord(headers, 'quotes', payload)
      console.log(`  + quote: ${spec.status} — ${spec.packageName}`)
    }
    quotes[spec.key] = row
  }
  return quotes
}

async function seedLeads(headers, orgId, packages, clients) {
  const existing = await listRecords(headers, 'leads', `organization_id = "${escapeFilter(orgId)}"`)
  if (existing === null) {
    console.warn('leads collection missing — run PocketBase migrations')
    return {}
  }

  const leads = {}
  for (const spec of LEAD_SPECS) {
    let lead = existing.find((l) => matchDemoNote(l.notes, spec.role))
    const body = {
      organization_id: orgId,
      name: spec.name,
      phone: spec.phone,
      email: spec.email ?? '',
      source: spec.source,
      vehicle_type: spec.vehicle_type,
      package_id: spec.packageName ? packageIdFor(packages, spec.packageName) : '',
      service_interest: spec.service_interest ?? '',
      quote_amount: spec.quote_amount ?? 0,
      stage: spec.stage,
      client_id: spec.clientKey ? clients[spec.clientKey] : '',
      notes: demoNote(spec.role, spec.notes),
    }
    if (lead) {
      await patchRecord(headers, 'leads', lead.id, body)
    } else {
      lead = await createRecord(headers, 'leads', body)
      console.log(`  + lead: ${spec.name}`)
    }
    leads[spec.role] = lead
  }
  return leads
}

async function createPortalToken(clientId, jobId) {
  if (!INTERNAL_SECRET) return null
  const res = await fetch(`${APP_URL}/api/portal/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': INTERNAL_SECRET },
    body: JSON.stringify({ clientId, jobId, scope: 'full' }),
  })
  if (!res.ok) {
    console.warn('Portal create failed:', res.status)
    return null
  }
  const data = await res.json()
  return data.token ?? null
}

function writeManifest({ orgId, jobs, clients, invoices, portalToken, packages }) {
  mkdirSync(marketingDir, { recursive: true })
  const fullDetailId = packages['full detail']
  const manifest = {
    generatedAt: new Date().toISOString(),
    orgSlug: ORG_SLUG,
    orgId,
    appUrl: APP_URL,
    businessName: DEMO_BUSINESS_NAME,
    ids: {
      paidJobId: jobs.completed_photos?.id,
      photoJobId: jobs.completed_photos?.id,
      inProgressJobId: jobs.in_progress?.id,
      clientMarcusId: clients.marcus,
      clientSarahId: clients.sarah,
      clientId: clients.marcus,
      sentInvoiceId: invoices.sent?.id,
      paidInvoiceId: invoices.paid?.id,
      fullDetailPackageId: fullDetailId,
    },
    routes: {
      home: '/',
      jobs: '/jobs',
      jobDetail: `/jobs/${jobs.completed_photos?.id}`,
      jobPhotos: `/jobs/${jobs.completed_photos?.id}/photos`,
      client: `/clients/${clients.marcus}`,
      reports: '/reports',
      pipeline: '/pipeline',
      booking: `/book/${ORG_SLUG}`,
      bookingDeep: fullDetailId
        ? `/book/${ORG_SLUG}?package=${fullDetailId}&date=${addDays(isoToday(), 1)}`
        : `/book/${ORG_SLUG}`,
      settingsBusiness: '/settings/business',
      portal: portalToken ? `/portal/${portalToken}` : null,
    },
    portalToken,
    portalUrl: portalToken ? `${APP_URL}/portal/${portalToken}` : null,
    capture: {
      viewport: { width: 390, height: 844, deviceScaleFactor: 3 },
      authEmail: process.env.DEMO_CAPTURE_EMAIL || PB_EMAIL,
    },
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`\nWrote ${manifestPath}`)
  return manifest
}

async function main() {
  const { headers } = await auth()
  const orgId = await resolveOrgId(headers)
  console.log(`Seeding full demo data for ${ORG_SLUG} (${orgId})\n`)

  console.log('Stock photos (Unsplash → marketing/assets/stock-photos/):')
  await ensureStockPhotos(stockPhotosDir, { force: FORCE_DEMO_PHOTOS })

  console.log('\nSettings:')
  await seedSettings(headers, orgId)

  console.log('Supplies:')
  const supplyIds = await seedSupplies(headers, orgId)

  console.log('Packages:')
  const packages = await seedPackages(headers, orgId, supplyIds)

  console.log('Equipment:')
  await seedEquipment(headers, orgId)

  console.log('Overhead:')
  await seedOverhead(headers, orgId)

  console.log('Business expenses:')
  await seedBusinessExpenses(headers, orgId)

  console.log('Clients:')
  const clients = await seedClients(headers, orgId)

  console.log('Vehicles:')
  const vehicles = await seedVehicles(headers, orgId, clients)

  console.log('Damage docs:')
  await seedDamage(headers, orgId, vehicles)

  console.log('Time off:')
  await seedTimeBlocks(headers, orgId)

  console.log('Jobs:')
  const jobs = await seedJobs(headers, orgId, packages, clients, supplyIds)

  console.log('Invoices:')
  const invoices = await seedInvoices(headers, orgId, jobs, clients)

  console.log('Job photos:')
  if (jobs.in_progress?.id) await uploadJobPhotos(headers, jobs.in_progress.id, 1)
  if (jobs.completed_photos?.id) await uploadJobPhotos(headers, jobs.completed_photos.id, 4)

  console.log('Leads:')
  const leads = await seedLeads(headers, orgId, packages, clients)

  console.log('Quotes:')
  await seedQuotes(headers, orgId, packages, clients, leads)

  console.log('Portal:')
  const portalToken = await createPortalToken(clients.marcus, jobs.completed_photos?.id)

  writeManifest({ orgId, jobs, clients, invoices, portalToken, packages })

  console.log('\nDone.')
  console.log('  Sign in and browse Home, Jobs, Clients, Pipeline, Reports, Inventory.')
  console.log('  Replace photos: edit marketing/assets/stock-photos/ then re-run seed:demo')
  console.log(`  Booking: /book/${ORG_SLUG}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
