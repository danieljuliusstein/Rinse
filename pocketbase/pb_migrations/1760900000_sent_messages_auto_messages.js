/// <reference path="../pb_data/types.d.ts" />

const TENANT_RULE = '@request.auth.id != "" && organization_id = @request.auth.organization_id'

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
    const settings = app.findCollectionByNameOrId('app_settings')
    const hasAutoMessages = settings.fields.some((f) => f.name === 'auto_messages')
    if (!hasAutoMessages) {
      settings.fields.add(new Field({ name: 'auto_messages', type: 'json' }))
      app.save(settings)
    }

    if (collectionExists(app, 'sent_messages')) return

    const organizations = app.findCollectionByNameOrId('organizations')
    const clients = app.findCollectionByNameOrId('clients')
    if (!organizations || !clients) {
      throw new Error('organizations or clients collection missing')
    }

    app.importCollections(
      [
        {
          name: 'sent_messages',
          type: 'base',
          listRule: TENANT_RULE,
          viewRule: TENANT_RULE,
          createRule: TENANT_RULE,
          updateRule: TENANT_RULE,
          deleteRule: TENANT_RULE,
          fields: [
            {
              name: 'organization_id',
              type: 'relation',
              collectionId: organizations.id,
              maxSelect: 1,
              required: true,
            },
            {
              name: 'client_id',
              type: 'relation',
              collectionId: clients.id,
              maxSelect: 1,
              required: true,
            },
            { name: 'template_id', type: 'text', required: true },
            { name: 'channel', type: 'select', required: true, values: ['sms', 'email'] },
            { name: 'preview', type: 'text', required: false },
            { name: 'body', type: 'text', required: false },
            { name: 'status', type: 'select', required: true, values: ['sent', 'failed'] },
            { name: 'error', type: 'text', required: false },
            { name: 'reference_id', type: 'text', required: false },
            { name: 'sent_at', type: 'date', required: true },
          ],
          indexes: [
            'CREATE INDEX `idx_sent_messages_org` ON `sent_messages` (`organization_id`)',
            'CREATE INDEX `idx_sent_messages_ref` ON `sent_messages` (`organization_id`, `template_id`, `reference_id`)',
          ],
        },
      ],
      false,
    )
  },
  (app) => {
    if (collectionExists(app, 'sent_messages')) {
      try {
        const collection = app.findCollectionByNameOrId('sent_messages')
        app.delete(collection)
      } catch {
        // ignore
      }
    }
    const settings = app.findCollectionByNameOrId('app_settings')
    const field = settings.fields.find((f) => f.name === 'auto_messages')
    if (field) {
      settings.fields.removeById(field.id)
      app.save(settings)
    }
  },
)
