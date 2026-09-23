// Model hooks also cover server/admin writes and public booking, not just client requests.
onRecordCreate((e) => require(__hooks + '/pricing.js').guardJob(e, true), 'jobs')
onRecordUpdate((e) => require(__hooks + '/pricing.js').guardJob(e, false), 'jobs')
onRecordUpdateRequest((e) => {
  if (!e.hasSuperuserAuth()) {
    const fields = require(__hooks + '/pricing.js').protectedFields
    for (const field of fields) {
      if (JSON.stringify(e.record.get(field)) !== JSON.stringify(e.record.original().get(field))) {
        throw new ForbiddenError('Billing fields can only be changed by the server')
      }
    }
  }
  e.next()
}, 'organizations')
onRecordUpdateRequest((e) => {
  if (!e.hasSuperuserAuth() && e.record.get('organization_id') !== e.record.original().get('organization_id')) {
    throw new ForbiddenError('Organization membership is managed by the server')
  }
  e.next()
}, 'users')
onRecordCreateRequest((e) => {
  if (!e.hasSuperuserAuth() && e.record.getString('organization_id')) throw new ForbiddenError('Use Rinse signup')
  e.next()
}, 'users')
onRecordCreate((e) => {
  const org = e.app.findRecordById('organizations', e.record.getString('organization_id'))
  if (!require(__hooks + '/pricing.js').paid(org)) throw new ForbiddenError('Pro required')
  e.next()
}, 'quotes', 'leads')
onRecordCreateRequest((e) => {
  if (!e.hasSuperuserAuth()) {
    const org = e.app.findRecordById('organizations', e.record.getString('organization_id'))
    if (e.record.getString('scope') !== 'invoice' && !require(__hooks + '/pricing.js').paid(org)) throw new ForbiddenError('Pro required')
  }
  e.next()
}, 'portal_tokens')

onRecordUpdateRequest((e) => {
  if (!e.hasSuperuserAuth()) {
    const org = e.app.findRecordById('organizations', e.record.getString('organization_id'))
    if (e.record.getString('scope') !== 'invoice' && !require(__hooks + '/pricing.js').paid(org)) throw new ForbiddenError('Pro required')
  }
  e.next()
}, 'portal_tokens')
