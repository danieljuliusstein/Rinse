/// <reference path="../pb_data/types.d.ts" />

const ORG_COLLECTION_ID = 'pbc_det_organizations'
const TENANT_RULE = '@request.auth.id != "" && organization_id = @request.auth.organization_id'

const DEFAULT_SCHEDULE = {
  work_days: [1, 2, 3, 4, 5, 6],
  start_time: '08:00',
  end_time: '18:00',
  lunch_start: '12:00',
  lunch_end: '13:00',
  slot_interval_minutes: 120,
}

const PACKAGE_DURATIONS = {
  'basic wash': 90,
  'full detail': 240,
  'paint correction': 300,
  'paint correct': 300,
  'ceramic coat': 360,
}

function safeGet(record, key) {
  try {
    return record.get(key)
  } catch {
    return undefined
  }
}

migrate(
  (app) => {
    const appSettings = app.findCollectionByNameOrId('app_settings')
    if (appSettings) {
      if (!appSettings.fields.getByName('booking_schedule')) {
        appSettings.fields.add(
          new Field({ name: 'booking_schedule', type: 'json', required: false }),
        )
      }
      if (!appSettings.fields.getByName('travel_rate_per_mile')) {
        appSettings.fields.add(
          new Field({ name: 'travel_rate_per_mile', type: 'number', required: false }),
        )
      }
      app.save(appSettings)
    }

    const packages = app.findCollectionByNameOrId('packages')
    if (packages && !packages.fields.getByName('duration_minutes')) {
      packages.fields.add(
        new Field({ name: 'duration_minutes', type: 'number', required: false }),
      )
      app.save(packages)
    }

    try {
      app.findCollectionByNameOrId('time_blocks')
    } catch {
      const snapshot = [
        {
          id: 'pbc_det_time_blocks',
          name: 'time_blocks',
          type: 'base',
          system: false,
          listRule: TENANT_RULE,
          viewRule: TENANT_RULE,
          createRule: TENANT_RULE,
          updateRule: TENANT_RULE,
          deleteRule: TENANT_RULE,
          indexes: [],
          fields: [
            {
              name: 'organization_id',
              type: 'relation',
              collectionId: ORG_COLLECTION_ID,
              maxSelect: 1,
              required: false,
            },
            { name: 'date', type: 'date', required: true },
            { name: 'start_time', type: 'text' },
            { name: 'end_time', type: 'text' },
            { name: 'all_day', type: 'bool' },
            { name: 'label', type: 'text' },
          ],
        },
      ]
      app.importCollections(snapshot, false)
    }

    const settingsRows = app.findAllRecords('app_settings')
    for (const row of settingsRows) {
      if (!safeGet(row, 'booking_schedule')) {
        row.set('booking_schedule', DEFAULT_SCHEDULE)
        app.save(row)
      }
    }

    const packageRows = app.findAllRecords('packages')
    for (const row of packageRows) {
      if (safeGet(row, 'duration_minutes')) continue
      const name = String(safeGet(row, 'name') ?? '').toLowerCase()
      const minutes = PACKAGE_DURATIONS[name]
      if (minutes) {
        row.set('duration_minutes', minutes)
        app.save(row)
      }
    }
  },
  (app) => {
    const timeBlocks = app.findCollectionByNameOrId('time_blocks')
    if (timeBlocks) app.delete(timeBlocks)

    const packages = app.findCollectionByNameOrId('packages')
    if (packages?.fields.getByName('duration_minutes')) {
      packages.fields.removeByName('duration_minutes')
      app.save(packages)
    }

    const appSettings = app.findCollectionByNameOrId('app_settings')
    if (appSettings) {
      if (appSettings.fields.getByName('booking_schedule')) {
        appSettings.fields.removeByName('booking_schedule')
      }
      if (appSettings.fields.getByName('travel_rate_per_mile')) {
        appSettings.fields.removeByName('travel_rate_per_mile')
      }
      app.save(appSettings)
    }
  },
)
