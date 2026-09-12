/// <reference path="../pb_data/types.d.ts" />

const DEFAULT_INVOICE_TERMS = 'Due on receipt. Thank you for your business.'

function safeGet(record, key) {
  try {
    return record.get(key)
  } catch {
    return undefined
  }
}

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    if (!collection) {
      console.warn('[backfill_invoice_terms] app_settings missing — skip')
      return
    }

    const records = app.findAllRecords('app_settings')
    let updated = 0
    for (const record of records) {
      const terms = safeGet(record, 'invoice_terms_footer')
      if (terms != null && String(terms).trim() !== '') continue
      record.set('invoice_terms_footer', DEFAULT_INVOICE_TERMS)
      app.save(record)
      updated++
    }
    console.log(`[backfill_invoice_terms] updated ${updated} record(s)`)
  },
  () => {
    // non-reversible
  }
)
