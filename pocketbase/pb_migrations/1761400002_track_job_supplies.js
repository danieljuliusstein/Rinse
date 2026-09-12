/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const appSettings = app.findCollectionByNameOrId('app_settings')
    if (appSettings && !appSettings.fields.getByName('track_job_supplies')) {
      appSettings.fields.add(new Field({ name: 'track_job_supplies', type: 'bool', required: false }))
      app.save(appSettings)
    }
  },
  (app) => {
    const appSettings = app.findCollectionByNameOrId('app_settings')
    if (appSettings?.fields.getByName('track_job_supplies')) {
      appSettings.fields.removeByName('track_job_supplies')
      app.save(appSettings)
    }
  },
)
