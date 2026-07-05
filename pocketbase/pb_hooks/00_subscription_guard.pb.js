/// PocketBase hooks — block creates when org subscription is lapsed (server-side paywall).
/// PB 0.39 JSVM only bundles code inside onRecordCreateRequest callbacks — keep logic inlined.

onRecordCreateRequest((e) => {
  const record = e.record
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

  const founding = org.get('founding_member') === true || org.get('plan') === 'founding'
  if (!founding) {
    const status = String(org.get('subscription_status') ?? 'none')
    let active = status === 'active' || status === 'past_due'
    if (!active && status === 'trialing') {
      const trialEnd = String(org.get('trial_ends_at') ?? '').trim()
      if (!trialEnd) {
        active = true
      } else {
        const end = new Date(trialEnd.indexOf('T') >= 0 ? trialEnd : trialEnd + 'T23:59:59')
        active = end >= new Date()
      }
    }
    if (!active) {
      throw new ForbiddenError('Active subscription required')
    }
  }

  e.next()
}, 'jobs')

onRecordCreateRequest((e) => {
  const record = e.record
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

  const founding = org.get('founding_member') === true || org.get('plan') === 'founding'
  if (!founding) {
    const status = String(org.get('subscription_status') ?? 'none')
    let active = status === 'active' || status === 'past_due'
    if (!active && status === 'trialing') {
      const trialEnd = String(org.get('trial_ends_at') ?? '').trim()
      if (!trialEnd) {
        active = true
      } else {
        const end = new Date(trialEnd.indexOf('T') >= 0 ? trialEnd : trialEnd + 'T23:59:59')
        active = end >= new Date()
      }
    }
    if (!active) {
      throw new ForbiddenError('Active subscription required')
    }
  }

  e.next()
}, 'clients')

onRecordCreateRequest((e) => {
  const record = e.record
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

  const founding = org.get('founding_member') === true || org.get('plan') === 'founding'
  if (!founding) {
    const status = String(org.get('subscription_status') ?? 'none')
    let active = status === 'active' || status === 'past_due'
    if (!active && status === 'trialing') {
      const trialEnd = String(org.get('trial_ends_at') ?? '').trim()
      if (!trialEnd) {
        active = true
      } else {
        const end = new Date(trialEnd.indexOf('T') >= 0 ? trialEnd : trialEnd + 'T23:59:59')
        active = end >= new Date()
      }
    }
    if (!active) {
      throw new ForbiddenError('Active subscription required')
    }
  }

  e.next()
}, 'quotes')

onRecordCreateRequest((e) => {
  const record = e.record
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

  const founding = org.get('founding_member') === true || org.get('plan') === 'founding'
  if (!founding) {
    const status = String(org.get('subscription_status') ?? 'none')
    let active = status === 'active' || status === 'past_due'
    if (!active && status === 'trialing') {
      const trialEnd = String(org.get('trial_ends_at') ?? '').trim()
      if (!trialEnd) {
        active = true
      } else {
        const end = new Date(trialEnd.indexOf('T') >= 0 ? trialEnd : trialEnd + 'T23:59:59')
        active = end >= new Date()
      }
    }
    if (!active) {
      throw new ForbiddenError('Active subscription required')
    }
  }

  e.next()
}, 'leads')
