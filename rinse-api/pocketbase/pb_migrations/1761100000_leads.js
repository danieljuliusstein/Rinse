/// <reference path="../pb_data/types.d.ts" />

const ORG_COLLECTION_ID = 'pbc_det_organizations'
const TENANT_RULE = '@request.auth.id != "" && organization_id = @request.auth.organization_id'

migrate((app) => {
  const snapshot = [
    {
      id: 'pbc_det_leads',
      name: 'leads',
      type: 'base',
      system: false,
      listRule: TENANT_RULE,
      viewRule: TENANT_RULE,
      createRule: TENANT_RULE,
      updateRule: TENANT_RULE,
      deleteRule: TENANT_RULE,
      indexes: [],
      fields: [
        {
          name: 'organization_id',
          type: 'relation',
          collectionId: ORG_COLLECTION_ID,
          maxSelect: 1,
          required: false,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'text' },
        {
          name: 'source',
          type: 'select',
          values: [
            'instagram',
            'google',
            'referral',
            'facebook',
            'tiktok',
            'word_of_mouth',
            'website',
            'text',
            'other',
          ],
        },
        {
          name: 'vehicle_type',
          type: 'select',
          values: ['sedan', 'suv', 'truck', 'van', 'boat', 'other'],
        },
        {
          name: 'package_id',
          type: 'relation',
          collectionId: 'pbc_det_packages',
          maxSelect: 1,
        },
        { name: 'service_interest', type: 'text' },
        { name: 'quote_amount', type: 'number' },
        {
          name: 'stage',
          type: 'select',
          required: true,
          values: ['inquiry', 'quoted', 'booked'],
        },
        {
          name: 'client_id',
          type: 'relation',
          collectionId: 'pbc_det_clients',
          maxSelect: 1,
        },
        {
          name: 'quote_id',
          type: 'relation',
          collectionId: 'pbc_det_quotes',
          maxSelect: 1,
        },
        {
          name: 'job_id',
          type: 'relation',
          collectionId: 'pbc_det_jobs',
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
      ],
    },
  ]

  return app.importCollections(snapshot, false)
})
