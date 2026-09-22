/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const org = app.findCollectionByNameOrId('organizations')
  org.fields.getByName('plan').values = ['free', 'starter', 'early', 'founding']
  org.fields.getByName('subscription_status').values = ['none', 'pending', 'active', 'past_due', 'canceled']
  for (const name of ['billing_provider', 'apple_original_transaction_id', 'billing_account_token']) {
    if (!org.fields.getByName(name)) org.fields.add(new TextField({ name }))
  }
  for (const name of ['cancel_at_period_end', 'early_used']) {
    if (!org.fields.getByName(name)) org.fields.add(new BoolField({ name }))
  }
  if (!org.fields.getByName('billing_sync_order')) org.fields.add(new NumberField({ name: 'billing_sync_order' }))
  app.save(org)
  const create = (name, fields, indexes = []) => {
    const collection = new Collection({ name, type: 'base', fields, indexes,
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
    app.save(collection)
    return collection
  }
  const mutex = create('billing_mutex', [{ name: 'value', type: 'number' }])
  const lock = new Record(mutex); lock.id = 'billinglock0001'; app.save(lock)
  create('billing_checkouts', [
    { name: 'organization_id', type: 'text', required: true },
    { name: 'provider', type: 'text' }, { name: 'plan', type: 'text' },
    { name: 'session_id', type: 'text' }, { name: 'state', type: 'text' },
    { name: 'expires_at', type: 'number' }, { name: 'consumed', type: 'bool' },
    { name: 'generation', type: 'number' },
  ], ['CREATE UNIQUE INDEX idx_checkout_org ON billing_checkouts (organization_id)'])
  create('early_allocations', [{ name: 'organization_id', type: 'text', required: true }], ['CREATE UNIQUE INDEX idx_early_org ON early_allocations (organization_id)'])
  create('billing_events', [{ name: 'event_id', type: 'text', required: true }],
    ['CREATE UNIQUE INDEX idx_billing_event ON billing_events (event_id)'])
  create('payment_reconciliations', [
    { name: 'payment_id', type: 'text', required: true }, { name: 'account_id', type: 'text' },
    { name: 'invoice_id', type: 'text' }, { name: 'amount', type: 'number' },
    { name: 'refunded', type: 'number' },
  ], ['CREATE UNIQUE INDEX idx_payment_identity ON payment_reconciliations (account_id, payment_id)'])
  create('waitlist', [
    { name: 'email', type: 'email', required: true },
    { name: 'interest', type: 'select', values: ['free', 'starter'] },
    { name: 'source', type: 'text' },
    { name: 'joined_at', type: 'date' },
  ], ['CREATE UNIQUE INDEX idx_waitlist_email ON waitlist (email)'])
}, (app) => {
  for (const name of ['early_allocations', 'waitlist', 'payment_reconciliations', 'billing_events', 'billing_checkouts', 'billing_mutex']) {
    app.delete(app.findCollectionByNameOrId(name))
  }
})
