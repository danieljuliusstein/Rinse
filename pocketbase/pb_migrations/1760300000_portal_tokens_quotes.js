/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const snapshot = [
    {
      id: 'pbc_det_quotes',
      name: 'quotes',
      type: 'base',
      system: false,
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      indexes: [],
      fields: [
        { name: 'quote_number', type: 'text', required: true },
        { name: 'client_id', type: 'relation', required: true, collectionId: 'pbc_det_clients', maxSelect: 1 },
        { name: 'package_id', type: 'relation', required: true, collectionId: 'pbc_det_packages', maxSelect: 1 },
        {
          name: 'vehicle_type',
          type: 'select',
          required: true,
          values: ['sedan', 'suv', 'truck', 'van', 'boat', 'other'],
        },
        {
          name: 'location_type',
          type: 'select',
          required: true,
          values: ['mobile', 'fixed'],
        },
        { name: 'date', type: 'date', required: true },
        { name: 'subtotal', type: 'number', required: true },
        { name: 'notes', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'sent', 'accepted', 'declined', 'expired'],
        },
        { name: 'valid_until', type: 'date' },
        { name: 'job_id', type: 'relation', collectionId: 'pbc_det_jobs', maxSelect: 1 },
        { name: 'sent_at', type: 'date' },
      ],
    },
    {
      id: 'pbc_det_portal_tokens',
      name: 'portal_tokens',
      type: 'base',
      system: false,
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      indexes: [],
      fields: [
        { name: 'token', type: 'text', required: true },
        {
          name: 'scope',
          type: 'select',
          required: true,
          values: ['job', 'photos', 'invoice', 'quote', 'full'],
        },
        { name: 'job_id', type: 'relation', collectionId: 'pbc_det_jobs', maxSelect: 1 },
        { name: 'quote_id', type: 'relation', collectionId: 'pbc_det_quotes', maxSelect: 1 },
        { name: 'client_id', type: 'relation', required: true, collectionId: 'pbc_det_clients', maxSelect: 1 },
        { name: 'expires_at', type: 'date', required: true },
        { name: 'revoked', type: 'bool' },
      ],
    },
  ]

  return app.importCollections(snapshot, false)
})
