// Existing organizations are exempt; organizations created after this migration are candidates.
migrate((app) => {
  const orgs = app.findCollectionByNameOrId('organizations')
  orgs.fields.add(new BoolField({ name: 'desktop_onboarding_candidate' }))
  app.save(orgs)
  const checkouts = app.findCollectionByNameOrId('billing_checkouts')
  checkouts.fields.add(new TextField({ name: 'return_context' })); app.save(checkouts)
  app.save(new Collection({ name: 'desktop_onboarding', type: 'base',
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: 'organization_id', type: 'relation', collectionId: orgs.id, maxSelect: 1, required: true },
      { name: 'version', type: 'number' }, { name: 'eligible', type: 'bool' },
      { name: 'plan_choice', type: 'text' }, { name: 'business_saved', type: 'bool' },
      { name: 'prepared', type: 'bool' }, { name: 'completed_at', type: 'date' },
    ], indexes: ['CREATE UNIQUE INDEX idx_desktop_onboarding_org ON desktop_onboarding (organization_id)'],
  }))
}, (app) => {
  app.delete(app.findCollectionByNameOrId('desktop_onboarding'))
  const checkouts = app.findCollectionByNameOrId('billing_checkouts')
  checkouts.fields.removeByName('return_context'); app.save(checkouts)
  const orgs = app.findCollectionByNameOrId('organizations')
  orgs.fields.removeByName('desktop_onboarding_candidate'); app.save(orgs)
})
