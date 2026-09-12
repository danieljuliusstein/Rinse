/// <reference path="../pb_data/types.d.ts" />

const ATLAS_SLUG = 'atlas-detailing'
const ATLAS_NAME = 'Atlas Detailing'

const DATA_COLLECTIONS = [
  'packages',
  'clients',
  'supplies',
  'equipment',
  'overhead_expenses',
  'business_expenses',
  'app_settings',
  'notifications_log',
  'jobs',
  'invoices',
  'quotes',
  'vehicles',
  'damage_docs',
  'portal_tokens',
]

function hasOrgField(collection) {
  try {
    return Boolean(collection?.fields?.getByName?.('organization_id'))
  } catch {
    return false
  }
}

function safeGet(record, key) {
  try {
    return record.get(key)
  } catch {
    return undefined
  }
}

migrate(
  (app) => {
    const orgCollection = app.findCollectionByNameOrId('organizations')
    if (!orgCollection) {
      console.warn('[backfill] organizations collection missing — skip')
      return
    }

    let org = null
    const existingOrgs = app.findAllRecords('organizations')
    for (const candidate of existingOrgs) {
      if (candidate && safeGet(candidate, 'slug') === ATLAS_SLUG) {
        org = candidate
        break
      }
    }

    if (!org) {
      let name = ATLAS_NAME
      try {
        const settings = app.findAllRecords('app_settings')
        for (const row of settings) {
          const businessName = row ? safeGet(row, 'business_name') : ''
          if (businessName) {
            name = businessName
            break
          }
        }
      } catch {
        // empty app_settings is fine
      }

      org = new Record(orgCollection)
      org.set('name', name)
      org.set('slug', ATLAS_SLUG)
      org.set('plan', 'founding')
      org.set('founding_member', true)
      org.set('booking_enabled', true)
      app.save(org)
      console.log('[backfill] created organization', ATLAS_SLUG)
    } else {
      console.log('[backfill] organization exists', ATLAS_SLUG)
    }

    const orgId = org.id
    if (!orgId) {
      throw new Error('[backfill] organization id missing after save')
    }

    for (const name of DATA_COLLECTIONS) {
      try {
        const collection = app.findCollectionByNameOrId(name)
        if (!collection || !hasOrgField(collection)) {
          console.warn(`[backfill] skip ${name} — no organization_id field`)
          continue
        }

        const records = app.findAllRecords(name)
        let updated = 0
        for (const record of records) {
          if (!record) continue
          if (safeGet(record, 'organization_id') === orgId) continue
          record.set('organization_id', orgId)
          app.save(record)
          updated++
        }
        console.log(`[backfill] ${name}: ${records.length} total, ${updated} updated`)
      } catch (err) {
        console.warn(`[backfill] ${name} failed:`, String(err))
      }
    }

    try {
      const usersCollection = app.findCollectionByNameOrId('users')
      if (usersCollection && hasOrgField(usersCollection)) {
        const users = app.findAllRecords('users')
        for (const user of users) {
          if (!user) continue
          if (safeGet(user, 'organization_id') === orgId) continue
          user.set('organization_id', orgId)
          app.save(user)
          console.log('[backfill] linked user', safeGet(user, 'email'))
        }
      }
    } catch (err) {
      console.warn('[backfill] users failed:', String(err))
    }
  },
  () => {
    // Intentionally no-op — do not strip organization_id on rollback
  },
)
