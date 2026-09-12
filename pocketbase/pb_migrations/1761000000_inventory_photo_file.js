/// <reference path="../pb_data/types.d.ts" />

const PHOTO_FIELD = {
  name: 'photo',
  type: 'file',
  maxSelect: 1,
  maxSize: 262144,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
}

function swapImageUrlForPhoto(app, collection) {
  if (!collection) return
  if (collection.fields.getByName('image_url')) {
    collection.fields.removeByName('image_url')
  }
  if (!collection.fields.getByName('photo')) {
    collection.fields.add(new Field(PHOTO_FIELD))
  }
  app.save(collection)
}

function restoreImageUrl(app, collection) {
  if (!collection) return
  if (collection.fields.getByName('photo')) {
    collection.fields.removeByName('photo')
  }
  if (!collection.fields.getByName('image_url')) {
    collection.fields.add(
      new Field({
        name: 'image_url',
        type: 'text',
        required: false,
      }),
    )
  }
  app.save(collection)
}

migrate(
  (app) => {
    swapImageUrlForPhoto(app, app.findCollectionByNameOrId('supplies'))
    swapImageUrlForPhoto(app, app.findCollectionByNameOrId('equipment'))
  },
  (app) => {
    restoreImageUrl(app, app.findCollectionByNameOrId('supplies'))
    restoreImageUrl(app, app.findCollectionByNameOrId('equipment'))
  },
)
