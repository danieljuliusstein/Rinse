/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const jobs = app.findCollectionByNameOrId('jobs')
    if (!jobs) return

    if (!jobs.fields.getByName('recurrence_cadence')) {
      jobs.fields.add(new Field({ name: 'recurrence_cadence', type: 'text', required: false }))
    }
    if (!jobs.fields.getByName('recurrence_anchor_date')) {
      jobs.fields.add(new Field({ name: 'recurrence_anchor_date', type: 'date', required: false }))
    }
    app.save(jobs)
  },
  (app) => {
    const jobs = app.findCollectionByNameOrId('jobs')
    if (!jobs) return
    for (const name of ['recurrence_cadence', 'recurrence_anchor_date']) {
      const field = jobs.fields.getByName(name)
      if (field) jobs.fields.removeById(field.id)
    }
    app.save(jobs)
  }
)
