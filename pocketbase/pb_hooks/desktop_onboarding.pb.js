onRecordCreate((e) => {
  e.record.set('desktop_onboarding_candidate', true)
  e.next()
}, 'organizations')
onRecordUpdateRequest((e) => {
  if (!e.hasSuperuserAuth() && e.record.getBool('desktop_onboarding_candidate') !== e.record.original().getBool('desktop_onboarding_candidate')) {
    throw new ForbiddenError('Desktop setup eligibility is managed by the server')
  }
  e.next()
}, 'organizations')

// All progress and optional records commit together. Retrying a completed step cannot duplicate data.
routerAdd('POST', '/api/rinse/desktop-onboarding', (e) => {
  const data = e.requestInfo().body
  let result
  e.app.runInTransaction((tx) => {
    const policy = require(__hooks + '/pricing.js')
    policy.lock(tx)
    const org = tx.findRecordById('organizations', String(data.orgId || ''))
    const rows = tx.findRecordsByFilter('desktop_onboarding', 'organization_id = {:org}', '', 1, 0, { org: org.id })
    const state = rows.length ? rows[0] : new Record(tx.findCollectionByNameOrId('desktop_onboarding'))
    if (!rows.length) {
      state.set('organization_id', org.id); state.set('version', 1)
      state.set('eligible', org.getBool('desktop_onboarding_candidate'))
    }
    const settingsRows = tx.findRecordsByFilter('app_settings', 'organization_id = {:org}', '-id', 1, 0, { org: org.id })
    const settings = settingsRows.length ? settingsRows[0] : new Record(tx.findCollectionByNameOrId('app_settings'))
    if (!settingsRows.length) {
      settings.set('organization_id', org.id)
      settings.set('business_name', org.getString('name'))
    }
    if (data.action === 'start') state.set('eligible', true)
    if (!state.getString('completed_at')) {
      if (data.action === 'plan') {
        if (data.choice !== 'free' && data.choice !== 'paid') throw new BadRequestError('Choose a plan')
        if (data.choice === 'paid' && !policy.paid(org)) throw new BadRequestError('Payment confirmation is still pending')
        state.set('plan_choice', policy.paid(org) ? 'paid' : 'free')
      }
      if (data.action === 'business') {
        if (!state.getString('plan_choice')) throw new BadRequestError('Choose a plan first')
        for (const key of ['business_name', 'business_phone', 'business_email', 'business_address', 'timezone']) settings.set(key, data.business[key])
        tx.save(settings)
        org.set('name', data.business.business_name); tx.save(org)
        state.set('business_saved', true)
      }
      if (data.action === 'prepare' && !state.getBool('prepared')) {
        if (!state.getBool('business_saved')) throw new BadRequestError('Save your business details first')
        if (data.service) {
          const service = new Record(tx.findCollectionByNameOrId('packages'))
          service.set('organization_id', org.id); service.set('name', data.service.name)
          service.set('base_price', data.service.price); service.set('active', true); tx.save(service)
        }
        if (data.client) {
          const client = new Record(tx.findCollectionByNameOrId('clients'))
          client.set('organization_id', org.id); client.set('name', data.client.name); tx.save(client)
        }
        state.set('prepared', true)
      }
      if (data.action === 'complete') {
        if (!state.getString('plan_choice') || !state.getBool('business_saved') || !state.getBool('prepared')) throw new BadRequestError('Finish the setup steps first')
        state.set('completed_at', new Date().toISOString())
      }
    }
    if (!rows.length || data.action !== 'read') tx.save(state)
    const services = tx.findRecordsByFilter('packages', 'organization_id = {:org}', 'name', 100, 0, { org: org.id })
    result = {
      eligible: state.getBool('eligible'), planChoice: state.getString('plan_choice'),
      businessSaved: state.getBool('business_saved'), prepared: state.getBool('prepared'), completedAt: state.getString('completed_at'),
      business: { business_name: settings.getString('business_name'), business_phone: settings.getString('business_phone'), business_email: settings.getString('business_email'), business_address: settings.getString('business_address'), timezone: settings.getString('timezone') },
      services: services.map((s) => ({ id: s.id, name: s.getString('name'), price: s.getFloat('base_price') })),
    }
  })
  return e.json(200, result)
}, $apis.requireSuperuserAuth())
