/// <reference path="../pb_data/types.d.ts" />

const ORG_COLLECTION_ID = 'pbc_det_organizations'
const TENANT_RULE = '@request.auth.id != "" && organization_id = @request.auth.organization_id'
const ORG_SELF_RULE = '@request.auth.id != "" && id = @request.auth.organization_id'

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

function addOrganizationField(collection) {
  const hasField = collection.fields.some((f) => f.name === 'organization_id')
  if (hasField) return
  collection.fields.add(
    new Field({
      name: 'organization_id',
      type: 'relation',
      collectionId: ORG_COLLECTION_ID,
      maxSelect: 1,
      required: false,
    }),
  )
}

function applyTenantRules(collection) {
  collection.listRule = TENANT_RULE
  collection.viewRule = TENANT_RULE
  collection.createRule = TENANT_RULE
  collection.updateRule = TENANT_RULE
  collection.deleteRule = TENANT_RULE
}

function restoreOpenRules(collection) {
  const rule = '@request.auth.id != ""'
  collection.listRule = rule
  collection.viewRule = rule
  collection.createRule = rule
  collection.updateRule = rule
  collection.deleteRule = rule
}

migrate(
  (app) => {
    const orgSnapshot = [
      {
        id: ORG_COLLECTION_ID,
        name: 'organizations',
        type: 'base',
        system: false,
        listRule: ORG_SELF_RULE,
        viewRule: ORG_SELF_RULE,
        createRule: null,
        updateRule: ORG_SELF_RULE,
        deleteRule: null,
        indexes: ['CREATE UNIQUE INDEX `idx_organizations_slug` ON `organizations` (`slug`)'],
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'slug', type: 'text', required: true },
          {
            name: 'plan',
            type: 'select',
            values: ['founding', 'starter', 'pro'],
          },
          { name: 'founding_member', type: 'bool' },
          { name: 'booking_enabled', type: 'bool' },
        ],
      },
    ]

    app.importCollections(orgSnapshot, false)

    for (const name of DATA_COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(name)
      if (!collection) {
        console.warn(`[multi-tenant] collection not found: ${name}`)
        continue
      }
      addOrganizationField(collection)
      applyTenantRules(collection)
      app.save(collection)
    }

    const users = app.findCollectionByNameOrId('users')
    if (users) {
      const hasOrg = users.fields.some((f) => f.name === 'organization_id')
      if (!hasOrg) {
        users.fields.add(
          new Field({
            name: 'organization_id',
            type: 'relation',
            collectionId: ORG_COLLECTION_ID,
            maxSelect: 1,
            required: false,
          }),
        )
        app.save(users)
      }
    }
  },
  (app) => {
    for (const name of DATA_COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(name)
      if (!collection) continue
      if (collection.fields.getByName('organization_id')) {
        collection.fields.removeByName('organization_id')
      }
      restoreOpenRules(collection)
      app.save(collection)
    }

    const users = app.findCollectionByNameOrId('users')
    if (users?.fields.getByName('organization_id')) {
      users.fields.removeByName('organization_id')
      app.save(users)
    }

    try {
      const orgs = app.findCollectionByNameOrId('organizations')
      if (orgs) app.delete(orgs)
    } catch {
      // ignore
    }
  },
)
