/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('invoices')
    if (!collection) return

    if (!collection.fields.getByName('extra_line_items')) {
      collection.fields.add(
        new Field({
          name: 'extra_line_items',
          type: 'json',
          required: false,
        })
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('invoices')
    if (!collection) return
    const field = collection.fields.getByName('extra_line_items')
    if (field) collection.fields.removeById(field.id)
    app.save(collection)
  }
)
