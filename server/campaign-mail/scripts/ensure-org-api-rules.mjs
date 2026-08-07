/**
 * Apply org-scoped PocketBase API rules on CRM collections.
 *
 * Idempotent: skips a collection when rules already match the target expressions,
 * unless --force is passed.
 *
 * Usage (from server/campaign-mail):
 *   node scripts/ensure-org-api-rules.mjs           # dry-run (default)
 *   node scripts/ensure-org-api-rules.mjs --apply   # write rules
 *   node scripts/ensure-org-api-rules.mjs --apply --force
 *
 * Requires PB_URL / PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD in .env
 *
 * Assumes users.organization_id exists and matches record.organization_id.
 * Adjust ORG_RULE below if your auth field name differs.
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

const apply = process.argv.includes('--apply')
const force = process.argv.includes('--force')

const pbUrl = (process.env.PB_URL || '').replace(/\/$/, '')
const email = process.env.PB_ADMIN_EMAIL
const password = process.env.PB_ADMIN_PASSWORD
if (!pbUrl || !email || !password) {
  console.error('Missing PB_URL / PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD')
  process.exit(1)
}

/** Authenticated member of the record's organization */
const ORG_MEMBER =
  '@request.auth.id != "" && organization_id = @request.auth.organization_id'

/**
 * Collections that should be org-scoped for list/view/create/update/delete.
 * campaign_sends: members can list/view; create/update/delete left empty (mail service uses admin).
 */
const RULESETS = {
  clients: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  vehicles: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  jobs: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  leads: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  packages: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  invoices: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  quotes: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  business_expenses: {
    list: ORG_MEMBER,
    view: ORG_MEMBER,
    create: ORG_MEMBER,
    update: ORG_MEMBER,
    delete: ORG_MEMBER,
  },
  time_blocks: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  activities: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  campaigns: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  campaign_sends: {
    list: ORG_MEMBER,
    view: ORG_MEMBER,
    create: null,
    update: null,
    delete: null,
  },
  forms: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  form_submissions: {
    list: ORG_MEMBER,
    view: ORG_MEMBER,
    create: ORG_MEMBER,
    update: ORG_MEMBER,
    delete: ORG_MEMBER,
  },
  chat_threads: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  chat_messages: {
    list: ORG_MEMBER,
    view: ORG_MEMBER,
    create: ORG_MEMBER,
    update: ORG_MEMBER,
    delete: ORG_MEMBER,
  },
  automations: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  app_settings: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
  damage_docs: { list: ORG_MEMBER, view: ORG_MEMBER, create: ORG_MEMBER, update: ORG_MEMBER, delete: ORG_MEMBER },
}

const pb = new PocketBase(pbUrl)
pb.autoCancellation(false)

try {
  await pb.collection('_superusers').authWithPassword(email, password)
} catch {
  await pb.admins.authWithPassword(email, password)
}

const cols = await pb.collections.getFullList()
const byName = new Map(cols.map((c) => [c.name, c]))

function norm(rule) {
  if (rule == null || rule === '') return null
  return String(rule).replace(/\s+/g, ' ').trim()
}

let changed = 0
let skippedMissing = 0
let skippedSame = 0

for (const [name, rules] of Object.entries(RULESETS)) {
  const col = byName.get(name)
  if (!col) {
    console.log(`skip missing collection: ${name}`)
    skippedMissing += 1
    continue
  }

  const fields = Array.isArray(col.fields) ? col.fields : Array.isArray(col.schema) ? col.schema : []
  const hasOrg = fields.some((f) => f.name === 'organization_id')
  if (!hasOrg) {
    console.log(`skip ${name}: no organization_id field`)
    skippedMissing += 1
    continue
  }

  const next = {
    listRule: rules.list,
    viewRule: rules.view,
    createRule: rules.create,
    updateRule: rules.update,
    deleteRule: rules.delete,
  }

  const same =
    norm(col.listRule) === norm(next.listRule) &&
    norm(col.viewRule) === norm(next.viewRule) &&
    norm(col.createRule) === norm(next.createRule) &&
    norm(col.updateRule) === norm(next.updateRule) &&
    norm(col.deleteRule) === norm(next.deleteRule)

  if (same && !force) {
    console.log(`ok ${name}: rules already match`)
    skippedSame += 1
    continue
  }

  const open =
    !norm(col.listRule) ||
    !norm(col.viewRule) ||
    col.listRule === '' ||
    col.viewRule === ''

  if (!force && !open && !same) {
    console.log(
      `skip ${name}: custom rules present (use --force to overwrite)\n` +
        `  list=${JSON.stringify(col.listRule)}\n` +
        `  view=${JSON.stringify(col.viewRule)}`,
    )
    continue
  }

  console.log(`${apply ? 'apply' : 'would apply'} ${name}`)
  console.log(`  list/view/create/update/delete → org member`)

  if (apply) {
    await pb.collections.update(col.id, next)
    changed += 1
  }
}

// organizations: members can view/update only their own org row
const orgs = byName.get('organizations')
if (orgs) {
  const orgSelf = '@request.auth.id != "" && id = @request.auth.organization_id'
  const next = {
    listRule: orgSelf,
    viewRule: orgSelf,
    createRule: null,
    updateRule: orgSelf,
    deleteRule: null,
  }
  const same =
    norm(orgs.listRule) === norm(next.listRule) &&
    norm(orgs.viewRule) === norm(next.viewRule) &&
    norm(orgs.updateRule) === norm(next.updateRule)
  if (same && !force) {
    console.log('ok organizations: rules already match')
  } else if (!force && norm(orgs.listRule) && norm(orgs.listRule) !== norm(orgSelf)) {
    console.log('skip organizations: custom rules present (use --force)')
  } else {
    console.log(`${apply ? 'apply' : 'would apply'} organizations (self-only)`)
    if (apply) {
      await pb.collections.update(orgs.id, next)
      changed += 1
    }
  }
}

console.log(
  `\nDone. apply=${apply} changed=${changed} same=${skippedSame} missing=${skippedMissing}`,
)
if (!apply) {
  console.log('Re-run with --apply to write rules.')
}
