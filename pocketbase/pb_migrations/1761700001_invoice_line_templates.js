/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const orgs = app.findCollectionByNameOrId('organizations')
    if (!orgs) return

    const collection = new Collection({
      name: 'invoice_line_templates',
      type: 'base',
      listRule: '@request.auth.id != "" && organization_id = @request.auth.organization_id',
      viewRule: '@request.auth.id != "" && organization_id = @request.auth.organization_id',
      createRule: '@request.auth.id != "" && organization_id = @request.auth.organization_id',
      updateRule: '@request.auth.id != "" && organization_id = @request.auth.organization_id',
      deleteRule: '@request.auth.id != "" && organization_id = @request.auth.organization_id',
      fields: [
        { name: 'organization_id', type: 'relation', required: true, collectionId: orgs.id, maxSelect: 1 },
        { name: 'description', type: 'text', required: true },
        { name: 'default_amount', type: 'number', required: true },
        { name: 'category', type: 'text', required: false },
        { name: 'active', type: 'bool', required: false },
        { name: 'package_id', type: 'text', required: false },
      ],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('invoice_line_templates')
    if (collection) app.delete(collection)
  }
)
