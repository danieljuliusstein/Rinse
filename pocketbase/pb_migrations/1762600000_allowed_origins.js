/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const orgs = app.findCollectionByNameOrId('organizations')
    if (orgs && !orgs.fields.some((f) => f.name === 'allowed_origins')) {
      orgs.fields.add(new Field({ name: 'allowed_origins', type: 'json', required: false }))
      app.save(orgs)
    }

    const appSettings = app.findCollectionByNameOrId('app_settings')
    if (appSettings && !appSettings.fields.some((f) => f.name === 'allowed_origins')) {
      appSettings.fields.add(new Field({ name: 'allowed_origins', type: 'json', required: false }))
      app.save(appSettings)
    }
  },
  (app) => {
    const orgs = app.findCollectionByNameOrId('organizations')
    if (orgs) {
      const f = orgs.fields.getByName('allowed_origins')
      if (f) orgs.fields.remove(f)
      app.save(orgs)
    }

    const appSettings = app.findCollectionByNameOrId('app_settings')
    if (appSettings) {
      const f = appSettings.fields.getByName('allowed_origins')
      if (f) appSettings.fields.remove(f)
      app.save(appSettings)
    }
  },
)
