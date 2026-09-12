/// <reference path="../pb_data/types.d.ts" />

const FROM_NAME = 'Paint Correct'
const TO_NAME = 'Paint Correction'

function safeGet(record, key) {
  try {
    return record.get(key)
  } catch {
    return undefined
  }
}

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('packages')
    if (!collection) {
      console.warn('[backfill_package_names] packages missing — skip')
      return
    }

    const records = app.findAllRecords('packages')
    let updated = 0
    for (const record of records) {
      if (safeGet(record, 'name') !== FROM_NAME) continue
      record.set('name', TO_NAME)
      app.save(record)
      updated++
    }
    console.log(`[backfill_package_names] renamed ${updated} package(s)`)
  },
  () => {
    // non-reversible
  }
)
