/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. jobs collection: deposit_status, deposit_amount, deposit_paid_at
    const jobs = app.findCollectionByNameOrId('jobs')
    if (jobs) {
      if (!jobs.fields.some((f) => f.name === 'deposit_status')) {
        jobs.fields.add(
          new Field({
            name: 'deposit_status',
            type: 'select',
            required: false,
            values: ['none', 'due', 'paid', 'waived'],
          }),
        )
      }
      if (!jobs.fields.some((f) => f.name === 'deposit_amount')) {
        jobs.fields.add(
          new Field({
            name: 'deposit_amount',
            type: 'number',
            required: false,
          }),
        )
      }
      if (!jobs.fields.some((f) => f.name === 'deposit_paid_at')) {
        jobs.fields.add(
          new Field({
            name: 'deposit_paid_at',
            type: 'date',
            required: false,
          }),
        )
      }
      app.save(jobs)
    }

    // 2. packages collection: deposit_amount
    const packages = app.findCollectionByNameOrId('packages')
    if (packages) {
      if (!packages.fields.some((f) => f.name === 'deposit_amount')) {
        packages.fields.add(
          new Field({
            name: 'deposit_amount',
            type: 'number',
            required: false,
          }),
        )
      }
      app.save(packages)
    }

    // 3. app_settings collection: deposit_required, default_deposit_amount
    const appSettings = app.findCollectionByNameOrId('app_settings')
    if (appSettings) {
      if (!appSettings.fields.some((f) => f.name === 'deposit_required')) {
        appSettings.fields.add(
          new Field({
            name: 'deposit_required',
            type: 'bool',
            required: false,
          }),
        )
      }
      if (!appSettings.fields.some((f) => f.name === 'default_deposit_amount')) {
        appSettings.fields.add(
          new Field({
            name: 'default_deposit_amount',
            type: 'number',
            required: false,
          }),
        )
      }
      app.save(appSettings)
    }
  },
  (app) => {
    const jobs = app.findCollectionByNameOrId('jobs')
    if (jobs) {
      const fStatus = jobs.fields.getByName('deposit_status')
      if (fStatus) jobs.fields.remove(fStatus)
      const fAmount = jobs.fields.getByName('deposit_amount')
      if (fAmount) jobs.fields.remove(fAmount)
      const fPaid = jobs.fields.getByName('deposit_paid_at')
      if (fPaid) jobs.fields.remove(fPaid)
      app.save(jobs)
    }

    const packages = app.findCollectionByNameOrId('packages')
    if (packages) {
      const f = packages.fields.getByName('deposit_amount')
      if (f) packages.fields.remove(f)
      app.save(packages)
    }

    const appSettings = app.findCollectionByNameOrId('app_settings')
    if (appSettings) {
      const fReq = appSettings.fields.getByName('deposit_required')
      if (fReq) appSettings.fields.remove(fReq)
      const fDef = appSettings.fields.getByName('default_deposit_amount')
      if (fDef) appSettings.fields.remove(fDef)
      app.save(appSettings)
    }
  },
)
