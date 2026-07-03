/// PocketBase hooks — block creates when org subscription is lapsed (server-side paywall).
/// Loads first (00_ prefix) so guards run before other onRecordCreateRequest hooks.

const PREMIUM_MSG = 'Active subscription required'

function isFoundingMember(org) {
  return org.get('founding_member') === true || org.get('plan') === 'founding'
}

function isSubscriptionActive(org) {
  if (isFoundingMember(org)) return true

  const status = String(org.get('subscription_status') ?? 'none')
  if (status === 'active' || status === 'past_due') return true

  if (status === 'trialing') {
    const trialEnd = String(org.get('trial_ends_at') ?? '').trim()
    if (!trialEnd) return true
    const end = new Date(trialEnd + 'T23:59:59')
    return end >= new Date()
  }

  return false
}

function requireActiveSubscription(record) {
  const orgId = String(record.get('organization_id') ?? '').trim()
  if (!orgId) {
    throw new ForbiddenError('Organization required')
  }

  let org
  try {
    org = $app.findRecordById('organizations', orgId)
  } catch (err) {
    throw new ForbiddenError('Organization not found')
  }

  if (!isSubscriptionActive(org)) {
    throw new ForbiddenError(PREMIUM_MSG)
  }
}

function guardCreate(e) {
  requireActiveSubscription(e.record)
  e.next()
}

;['jobs', 'clients', 'quotes', 'leads'].forEach(function (collection) {
  onRecordCreateRequest(function (e) {
    guardCreate(e)
  }, collection)
})
