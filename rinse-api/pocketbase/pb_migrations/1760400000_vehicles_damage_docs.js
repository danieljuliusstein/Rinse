/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const snapshot = [
    {
      id: 'pbc_det_vehicles',
      name: 'vehicles',
      type: 'base',
      system: false,
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      indexes: [],
      fields: [
        {
          name: 'client_id',
          type: 'relation',
          required: true,
          collectionId: 'pbc_det_clients',
          maxSelect: 1,
        },
        { name: 'year', type: 'number' },
        { name: 'make', type: 'text', required: true },
        { name: 'model', type: 'text', required: true },
        { name: 'color', type: 'text' },
        { name: 'color_hex', type: 'text' },
        { name: 'vin', type: 'text' },
        { name: 'plate', type: 'text' },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['sedan', 'suv', 'truck', 'van', 'boat', 'other'],
        },
        { name: 'photo', type: 'file', maxSelect: 1, maxSize: 5242880 },
      ],
    },
    {
      id: 'pbc_det_damage_docs',
      name: 'damage_docs',
      type: 'base',
      system: false,
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      indexes: [],
      fields: [
        {
          name: 'vehicle_id',
          type: 'relation',
          required: true,
          collectionId: 'pbc_det_vehicles',
          maxSelect: 1,
        },
        {
          name: 'job_id',
          type: 'relation',
          collectionId: 'pbc_det_jobs',
          maxSelect: 1,
        },
        { name: 'area', type: 'text', required: true },
        { name: 'note', type: 'text' },
        { name: 'date', type: 'date', required: true },
        { name: 'captured_at', type: 'text' },
        { name: 'photo', type: 'file', maxSelect: 1, maxSize: 5242880 },
      ],
    },
  ]

  return app.importCollections(snapshot, false)
})
