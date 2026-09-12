/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('invoices')
    if (!collection) return

    if (!collection.fields.some((f) => f.name === 'signature_url')) {
      collection.fields.add(
        new Field({
          name: 'signature_url',
          type: 'text',
          required: false,
        }),
      )
    }

    if (!collection.fields.some((f) => f.name === 'signed_at')) {
      collection.fields.add(
        new Field({
          name: 'signed_at',
          type: 'date',
          required: false,
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('invoices')
    if (!collection) return
    if (collection.fields.getByName('signature_url')) {
      collection.fields.removeByName('signature_url')
    }
    if (collection.fields.getByName('signed_at')) {
      collection.fields.removeByName('signed_at')
    }
    app.save(collection)
  },
)
