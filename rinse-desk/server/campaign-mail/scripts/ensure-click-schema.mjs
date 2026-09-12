/**
 * Idempotent PocketBase schema patch for email click tracking.
 *
 * Adds:
 *   - campaigns.stats_clicked (number)
 *   - campaign_sends.clicked_at (date)
 * Creates campaign_sends if missing.
 *
 * Usage (from server/campaign-mail):
 *   node scripts/ensure-click-schema.mjs
 *
 * Reads PB_URL / PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD from .env or the environment.
 */
import PocketBase from 'pocketbase'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const k = t.slice(0, i)
    let v = t.slice(i + 1)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (!(k in process.env)) process.env[k] = v
  }
}

const pbUrl = (process.env.PB_URL || '').replace(/\/$/, '')
const email = process.env.PB_ADMIN_EMAIL
const password = process.env.PB_ADMIN_PASSWORD
if (!pbUrl || !email || !password) {
  console.error('Missing PB_URL / PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD')
  process.exit(1)
}

const pb = new PocketBase(pbUrl)
pb.autoCancellation(false)

try {
  await pb.collection('_superusers').authWithPassword(email, password)
} catch {
  await pb.admins.authWithPassword(email, password)
}

function fieldDefs(col) {
  return Array.isArray(col.fields) ? col.fields : Array.isArray(col.schema) ? col.schema : []
}
function hasField(col, name) {
  return fieldDefs(col).some((f) => f.name === name)
}
function usesFieldsApi(col) {
  return Array.isArray(col.fields)
}

async function getCollection(name) {
  const cols = await pb.collections.getFullList()
  const col = cols.find((c) => c.name === name)
  if (!col) throw new Error(`Collection not found: ${name}`)
  return col
}

async function addField(colName, field) {
  const col = await getCollection(colName)
  if (hasField(col, field.name)) {
    console.log(`${colName}.${field.name} already exists`)
    return
  }
  const fields = fieldDefs(col)
  const patch = usesFieldsApi(col)
    ? { fields: [...fields, field] }
    : { schema: [...fields, field] }
  await pb.collections.update(col.id, patch)
  console.log(`Added ${colName}.${field.name}`)
}

await addField('campaigns', {
  name: 'stats_clicked',
  type: 'number',
  required: false,
  presentable: false,
  unique: false,
  onlyInt: true,
})

try {
  await getCollection('campaign_sends')
} catch {
  const all = await pb.collections.getFullList()
  const orgs = all.find((c) => c.name === 'organizations' || c.name === 'orgs')
  const orgField = orgs
    ? {
        name: 'organization_id',
        type: 'relation',
        required: true,
        collectionId: orgs.id,
        cascadeDelete: false,
        maxSelect: 1,
      }
    : { name: 'organization_id', type: 'text', required: true }

  await pb.collections.create({
    name: 'campaign_sends',
    type: 'base',
    fields: [
      orgField,
      { name: 'campaign_id', type: 'text', required: true },
      { name: 'contact_id', type: 'text', required: true },
      { name: 'resend_email_id', type: 'text', required: true },
      { name: 'to_email', type: 'email', required: true },
      { name: 'opened_at', type: 'date', required: false },
      { name: 'clicked_at', type: 'date', required: false },
    ],
    indexes: [
      'CREATE UNIQUE INDEX `idx_campaign_sends_resend_email_id` ON `campaign_sends` (`resend_email_id`)',
      'CREATE INDEX `idx_campaign_sends_campaign_id` ON `campaign_sends` (`campaign_id`)',
    ],
  })
  console.log('Created campaign_sends')
}

await addField('campaign_sends', {
  name: 'clicked_at',
  type: 'date',
  required: false,
  presentable: false,
})

const campaigns = await getCollection('campaigns')
const sends = await getCollection('campaign_sends')
console.log('Verify:', {
  stats_clicked: hasField(campaigns, 'stats_clicked'),
  clicked_at: hasField(sends, 'clicked_at'),
})
