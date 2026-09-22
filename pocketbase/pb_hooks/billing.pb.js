// Only the API's superuser client can call this transactional boundary.
routerAdd('POST', '/api/rinse/billing', (e) => {
  const data = e.requestInfo().body
  const policy = require(__hooks + '/pricing.js')
  let result = {}
  e.app.runInTransaction((tx) => {
    policy.lock(tx)
    const org = tx.findRecordById('organizations', String(data.orgId || ''))
    const findCheckout = () => {
      const rows = tx.findRecordsByFilter('billing_checkouts', 'organization_id = {:org}', '', 1, 0, { org: org.id })
      return rows.length ? rows[0] : null
    }
    let checkout = findCheckout()
    const now = Date.now()
    if (data.action === 'reserve') {
      if (org.get('founding_member') || ['pending', 'active', 'past_due'].indexOf(org.getString('subscription_status')) >= 0) throw new BadRequestError('Manage your existing subscription before purchasing another')
      if (checkout && checkout.getString('state') === 'pending' && checkout.getFloat('expires_at') > now) {
        if (checkout.getString('provider') !== data.provider) throw new BadRequestError('A checkout is already pending with another provider')
        result = checkout.publicExport(); return
      }
      const occupied = policy.count(tx, 'early_allocations') + policy.count(tx, 'billing_checkouts', 'plan = "early" && consumed = false && state = "pending" && expires_at > {:now}', { now })
      const plan = !org.getBool('early_used') && occupied < 100 ? 'early' : 'starter'
      if (!checkout) checkout = new Record(tx.findCollectionByNameOrId('billing_checkouts'))
      checkout.set('organization_id', org.id)
      checkout.set('provider', data.provider)
      checkout.set('return_context', data.returnContext === 'desktop_onboarding' ? data.returnContext : '')
      checkout.set('plan', plan)
      checkout.set('state', 'pending')
      checkout.set('session_id', '')
      checkout.set('generation', checkout.getFloat('generation') + 1)
      checkout.set('expires_at', now + (data.provider === 'apple' ? 86400000 : 2100000))
      tx.save(checkout)
      result = checkout.publicExport(); return
    }
    if (data.action === 'bind') {
      if (!checkout || checkout.getFloat('generation') !== data.generation || checkout.getString('state') !== 'pending') throw new BadRequestError('Checkout expired')
      checkout.set('session_id', data.sessionId); tx.save(checkout)
      if (data.customerId) org.set('stripe_customer_id', data.customerId)
      if (data.accountToken) org.set('billing_account_token', data.accountToken)
      tx.save(org); result = { ok: true }; return
    }
    if (data.action === 'release') {
      if (checkout && checkout.getString('state') === 'pending' && checkout.getFloat('generation') === data.generation) {
        checkout.set('state', 'abandoned'); tx.save(checkout)
      }
      result = { ok: true }; return
    }
    if (data.action === 'founding') {
      if (org.getString('billing_provider') && ['pending', 'active', 'past_due'].indexOf(org.getString('subscription_status')) >= 0) throw new BadRequestError('Cancel the paid subscription before granting Founding')
      if (!org.getBool('founding_member') && policy.count(tx, 'organizations', 'founding_member = true && is_platform_internal != true') >= 20) throw new BadRequestError('All 20 Founding benefits have been granted')
      org.set('plan', 'founding'); org.set('founding_member', true); org.set('subscription_status', 'none')
      tx.save(org); result = { ok: true }; return
    }
    if (data.action === 'sync') {
      const seen = policy.count(tx, 'billing_events', 'event_id = {:id}', { id: data.eventId })
      if (seen) { result = { ok: true, duplicate: true }; return }
      if (org.getBool('founding_member')) throw new BadRequestError('Founding does not need a subscription')
      if (data.order && org.getFloat('billing_sync_order') > data.order) { result = { ok: true, stale: true }; return }
      const existingId = data.provider === 'apple' ? org.getString('apple_original_transaction_id') : org.getString('stripe_subscription_id')
      const currentProvider = org.getString('billing_provider')
      if (currentProvider && currentProvider !== data.provider && ['pending', 'active', 'past_due'].indexOf(org.getString('subscription_status')) >= 0) throw new BadRequestError('Another provider subscription exists')
      if (existingId && existingId !== data.subscriptionId && ['pending', 'active', 'past_due'].indexOf(org.getString('subscription_status')) >= 0) throw new BadRequestError('Another subscription exists')
      const continuing = existingId === data.subscriptionId && org.getString('plan') === 'early'
      if (data.plan === 'early' && data.status === 'active' && data.paid && !continuing) {
        if (org.getBool('early_used')) throw new BadRequestError('Terminated Early offers cannot be restored')
        if (!checkout || checkout.getString('plan') !== 'early' || checkout.getString('provider') !== data.provider) throw new BadRequestError('No Early reservation')
        const others = policy.count(tx, 'early_allocations') + policy.count(tx, 'billing_checkouts', 'organization_id != {:org} && plan = "early" && consumed = false && state = "pending" && expires_at > {:now}', { org: org.id, now })
        if (others >= 100) throw new BadRequestError('Early reservation expired; contact support for a refund')
        const allocation = new Record(tx.findCollectionByNameOrId('early_allocations')); allocation.set('organization_id', org.id); tx.save(allocation)
        checkout.set('consumed', true); org.set('early_used', true)
      }
      if (checkout && data.paid && data.status === 'active') { checkout.set('state', 'paid'); tx.save(checkout) }
      const active = data.status === 'active' && data.paid && new Date(data.periodEnd).getTime() > now
      org.set('plan', active || data.status === 'past_due' ? data.plan : 'free')
      org.set('subscription_status', active ? 'active' : data.status === 'past_due' ? 'past_due' : ['active', 'incomplete'].indexOf(data.status) >= 0 ? 'pending' : 'none')
      if (data.order) org.set('billing_sync_order', data.order)
      org.set('billing_provider', data.provider)
      org.set(data.provider === 'apple' ? 'apple_original_transaction_id' : 'stripe_subscription_id', data.subscriptionId)
      org.set('current_period_end', data.periodEnd || '')
      org.set('cancel_at_period_end', !!data.cancelAtPeriodEnd)
      if (data.customerId) org.set('stripe_customer_id', data.customerId)
      if (!active) org.set('booking_enabled', false)
      tx.save(org)
      const event = new Record(tx.findCollectionByNameOrId('billing_events')); event.set('event_id', data.eventId); tx.save(event)
      result = { ok: true, plan: org.getString('plan'), subscription_status: org.getString('subscription_status'), current_period_end: org.getString('current_period_end') }; return
    }
    throw new BadRequestError('Unknown billing action')
  })
  return e.json(200, result)
}, $apis.requireSuperuserAuth())
