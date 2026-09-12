/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    if (!collection) return

    const addField = (name, type, options = {}) => {
      if (collection.fields.some((f) => f.name === name)) return
      collection.fields.add(new Field({ name, type, required: false, ...options }))
    }

    addField('onboarding_step', 'number')
    addField('onboarding_completed_at', 'date')
    addField('onboarding_first_invoice_at', 'date')
    addField('invoice_template', 'text')

    app.save(collection)

    // Existing orgs with a phone number are treated as already onboarded.
    try {
      const records = app.findRecordsByFilter('app_settings', 'business_phone != ""')
      for (const record of records) {
        if (record.get('onboarding_completed_at')) continue
        record.set('onboarding_completed_at', new Date().toISOString().slice(0, 10))
        if (!record.get('onboarding_step')) {
          record.set('onboarding_step', 6)
        }
        app.save(record)
      }
    } catch {
      // best-effort backfill
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    if (!collection) return
    for (const name of [
      'onboarding_step',
      'onboarding_completed_at',
      'onboarding_first_invoice_at',
      'invoice_template',
    ]) {
      if (collection.fields.getByName(name)) {
        collection.fields.removeByName(name)
      }
    }
    app.save(collection)
  },
)
