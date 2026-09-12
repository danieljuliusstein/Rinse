/// <reference path="../pb_data/types.d.ts" />

/** Align `clients.lead_source` with lead `source` (text, website). */
const LEAD_SOURCE_VALUES = [
  'google',
  'referral',
  'instagram',
  'facebook',
  'tiktok',
  'word_of_mouth',
  'website',
  'text',
  'other',
]

migrate(
  (app) => {
    const clients = app.findCollectionByNameOrId('clients')
    if (!clients) return

    const field = clients.fields.getByName('lead_source')
    if (!field) return

    const current = Array.isArray(field.values) ? field.values.map(String) : []
    const missing = LEAD_SOURCE_VALUES.filter((v) => !current.includes(v))
    if (missing.length === 0) return

    field.values = LEAD_SOURCE_VALUES
    app.save(clients)
  },
  () => {
    // Keep expanded values on rollback — existing client rows may use them.
  },
)
