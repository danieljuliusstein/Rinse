/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    if (!collection) return
    const hasField = collection.fields.some((f) => f.name === 'accent_color')
    if (hasField) return
    collection.fields.add(
      new Field({
        name: 'accent_color',
        type: 'text',
        required: false,
      }),
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    if (!collection) return
    if (collection.fields.getByName('accent_color')) {
      collection.fields.removeByName('accent_color')
      app.save(collection)
    }
  },
)
