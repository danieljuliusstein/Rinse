/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('business_expenses')
  if (collection) {
    collection.fields.add(
      new Field({
        name: 'equipment_id',
        type: 'relation',
        collectionId: 'pbc_det_equipment',
        maxSelect: 1,
        required: false,
      })
    )
    app.save(collection)
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId('business_expenses')
  if (collection) {
    collection.fields.removeByName('equipment_id')
    app.save(collection)
  }
})
