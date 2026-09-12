/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let collection
    try {
      collection = app.findCollectionByNameOrId('platform_events')
    } catch {
      return
    }

    if (collection.fields.some((field) => field.name === 'occurred_at')) return

    collection.fields.add(
      new Field({
        name: 'occurred_at',
        type: 'date',
        required: false,
      }),
    )
    app.save(collection)
  },
  (app) => {
    let collection
    try {
      collection = app.findCollectionByNameOrId('platform_events')
    } catch {
      return
    }

    const field = collection.fields.find((f) => f.name === 'occurred_at')
    if (!field) return
    collection.fields.removeById(field.id)
    app.save(collection)
  },
)
