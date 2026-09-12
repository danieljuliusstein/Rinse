/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const snapshot = [
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
        // PB 0.39 treats `false` as blank when required — blocks token creation.
        { name: 'revoked', type: 'bool' },
      ],
    },
  ]

  return app.importCollections(snapshot, false)
})
