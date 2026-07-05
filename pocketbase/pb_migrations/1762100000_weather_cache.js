/// <reference path="../pb_data/types.d.ts" />

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
    if (collectionExists(app, 'weather_cache')) return

    app.importCollections(
      [
        {
          name: 'weather_cache',
          type: 'base',
          listRule: null,
          viewRule: null,
          createRule: null,
          updateRule: null,
          deleteRule: null,
          fields: [
            {
              name: 'kind',
              type: 'select',
              required: true,
              values: ['geocode', 'forecast'],
            },
            { name: 'cache_key', type: 'text', required: true },
            { name: 'payload', type: 'json' },
            { name: 'cached_on', type: 'date', required: true },
          ],
          indexes: [
            'CREATE UNIQUE INDEX `idx_weather_cache_kind_key` ON `weather_cache` (`kind`, `cache_key`)',
            'CREATE INDEX `idx_weather_cache_cached_on` ON `weather_cache` (`cached_on`)',
          ],
        },
      ],
      false,
    )
  },
  (app) => {
    if (!collectionExists(app, 'weather_cache')) return
    try {
      const collection = app.findCollectionByNameOrId('weather_cache')
      app.delete(collection)
    } catch {
      /* noop */
    }
  },
)
