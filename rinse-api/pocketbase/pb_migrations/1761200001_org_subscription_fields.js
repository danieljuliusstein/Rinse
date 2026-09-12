/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')
    if (!collection) return

    const addText = (name) => {
      if (collection.fields.some((f) => f.name === name)) return
      collection.fields.add(new Field({ name, type: 'text', required: false }))
    }

    addText('stripe_customer_id')
    addText('stripe_subscription_id')

    if (!collection.fields.some((f) => f.name === 'subscription_status')) {
      collection.fields.add(
        new Field({
          name: 'subscription_status',
          type: 'select',
          values: ['trialing', 'active', 'past_due', 'canceled', 'none'],
        }),
      )
    }

    if (!collection.fields.some((f) => f.name === 'trial_ends_at')) {
      collection.fields.add(new Field({ name: 'trial_ends_at', type: 'date', required: false }))
    }

    if (!collection.fields.some((f) => f.name === 'current_period_end')) {
      collection.fields.add(new Field({ name: 'current_period_end', type: 'date', required: false }))
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')
    if (!collection) return
    for (const name of [
      'stripe_customer_id',
      'stripe_subscription_id',
      'subscription_status',
      'trial_ends_at',
      'current_period_end',
    ]) {
      if (collection.fields.getByName(name)) {
        collection.fields.removeByName(name)
      }
    }
    app.save(collection)
  },
)
