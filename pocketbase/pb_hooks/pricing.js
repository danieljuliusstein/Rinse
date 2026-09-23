// JSVM mirror of packages/core/src/pricing.ts, covered by contract/integration tests.
exports.active = (status) => ['scheduled', 'in_progress'].indexOf(status) >= 0
exports.paid = (org) => (org.get('plan') === 'founding' && org.get('founding_member') === true) ||
  (['starter', 'early'].indexOf(org.get('plan')) >= 0 && org.get('subscription_status') === 'active' &&
    new Date(String(org.get('current_period_end')).replace(' ', 'T')).getTime() > Date.now())
exports.lock = (app) => app.db().newQuery('UPDATE billing_mutex SET value = value + 1 WHERE id = {:id}').bind({ id: 'billinglock0001' }).execute()
exports.protectedFields = ['plan', 'founding_member', 'subscription_status', 'current_period_end', 'trial_ends_at', 'stripe_customer_id', 'stripe_subscription_id', 'billing_provider', 'apple_original_transaction_id', 'billing_account_token', 'cancel_at_period_end', 'early_used', 'billing_sync_order', 'stripe_connect_account_id', 'stripe_connect_charges_enabled', 'is_platform_internal']
exports.guardJob = (e, creating) => {
  const policy = require(__hooks + '/pricing.js')
  e.app.runInTransaction((tx) => {
    policy.lock(tx)
    const record = e.record
    const orgId = record.getString('organization_id')
    if (!orgId) throw new ForbiddenError('Organization required')
    const org = tx.findRecordById('organizations', orgId)
    // Read the persisted status under the write lock, not a stale request snapshot.
    const old = creating ? null : tx.findRecordById('jobs', record.id)
    if (old && old.getString('organization_id') !== orgId) throw new ForbiddenError('Cannot move jobs between organizations')
    if (policy.active(record.getString('status')) && !(old && policy.active(old.getString('status'))) && !policy.paid(org)) {
      const count = policy.count(tx, 'jobs', 'organization_id = {:org} && (status = "scheduled" || status = "in_progress")', { org: orgId })
      if (count >= 5) throw new ForbiddenError('Free includes 5 active jobs. Complete or cancel a job, or upgrade to Pro.')
    }
    const previousApp = e.app
    e.app = tx
    try { e.next() } finally { e.app = previousApp }
  })
}

exports.count = (app, collection, filter, params) => filter ? app.countRecords(collection, $dbx.exp(filter.replace(/&&/g, ' AND ').replace(/\|\|/g, ' OR '), params || {})) : app.countRecords(collection)
