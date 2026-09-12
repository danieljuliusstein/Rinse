/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const supplies = app.findCollectionByNameOrId('supplies')
  if (supplies) {
    supplies.fields.add(
      new Field({
        name: 'icon_key',
        type: 'text',
        required: false,
      })
    )
    app.save(supplies)
  }

  const equipment = app.findCollectionByNameOrId('equipment')
  if (equipment) {
    equipment.fields.add(
      new Field({
        name: 'icon_key',
        type: 'text',
        required: false,
      })
    )
    app.save(equipment)
  }
}, (app) => {
  const supplies = app.findCollectionByNameOrId('supplies')
  if (supplies) {
    supplies.fields.removeByName('icon_key')
    app.save(supplies)
  }
  const equipment = app.findCollectionByNameOrId('equipment')
  if (equipment) {
    equipment.fields.removeByName('icon_key')
    app.save(equipment)
  }
})
