/// <reference path="../pb_data/types.d.ts" />

function collectionExists(app, name) {
  try {
    app.findCollectionByNameOrId(name)
    return true
  } catch {
    return false
  }
}

migrate(
  (app) => {
    if (collectionExists(app, 'platform_events')) return

    const orgCollection = app.findCollectionByNameOrId('organizations')
    const orgCollectionId = orgCollection.id

    const fields = [
      {
        name: 'type',
        type: 'text',
        required: true,
        min: 1,
        max: 64,
      },
      {
        name: 'category',
        type: 'select',
        required: true,
        values: ['product', 'security', 'admin', 'billing'],
      },
      {
        name: 'organization_id',
        type: 'relation',
        collectionId: orgCollectionId,
        maxSelect: 1,
        required: false,
      },
      { name: 'actor_email', type: 'text', required: false },
      { name: 'detail', type: 'text', required: false, max: 500 },
      { name: 'metadata', type: 'json', required: false },
    ]

    app.importCollections(
      [
        {
          name: 'platform_events',
          type: 'base',
          listRule: null,
          viewRule: null,
          createRule: null,
          updateRule: null,
          deleteRule: null,
          fields,
          indexes: [
            'CREATE INDEX `idx_platform_events_type` ON `platform_events` (`type`)',
            'CREATE INDEX `idx_platform_events_org` ON `platform_events` (`organization_id`)',
          ],
        },
      ],
      false,
    )
  },
  (app) => {
    if (!collectionExists(app, 'platform_events')) return
    try {
      const collection = app.findCollectionByNameOrId('platform_events')
      app.delete(collection)
    } catch {
      /* noop */
    }
  },
)
