/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'app_settings',
        'onboarding_completed_at = "" || onboarding_completed_at = null',
      )
      for (const record of records) {
        const step = Number(record.get('onboarding_step') ?? 1)
        if (step >= 2 && step <= 4) {
          record.set('onboarding_step', 2)
        } else if (step === 5) {
          record.set('onboarding_step', 3)
        } else if (step >= 6) {
          record.set('onboarding_step', 4)
        }
        app.save(record)
      }
    } catch {
      // best-effort backfill
    }
  },
  (app) => {
    // irreversible step remap
  },
)
