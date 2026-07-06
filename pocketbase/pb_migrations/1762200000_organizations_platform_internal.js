/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')
    if (!collection) return

    if (!collection.fields.some((f) => f.name === 'is_platform_internal')) {
      collection.fields.add(
        new Field({
          name: 'is_platform_internal',
          type: 'bool',
          required: false,
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')
    if (!collection) return
    if (collection.fields.getByName('is_platform_internal')) {
      collection.fields.removeByName('is_platform_internal')
    }
    app.save(collection)
  },
)
