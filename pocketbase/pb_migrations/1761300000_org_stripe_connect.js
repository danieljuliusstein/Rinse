/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')
    if (!collection) return

    if (!collection.fields.some((f) => f.name === 'stripe_connect_account_id')) {
      collection.fields.add(
        new Field({ name: 'stripe_connect_account_id', type: 'text', required: false }),
      )
    }

    if (!collection.fields.some((f) => f.name === 'stripe_connect_charges_enabled')) {
      collection.fields.add(
        new Field({ name: 'stripe_connect_charges_enabled', type: 'bool', required: false }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')
    if (!collection) return
    for (const name of ['stripe_connect_account_id', 'stripe_connect_charges_enabled']) {
      if (collection.fields.getByName(name)) {
        collection.fields.removeByName(name)
      }
    }
    app.save(collection)
  },
)
