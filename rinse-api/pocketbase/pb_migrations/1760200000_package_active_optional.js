/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const snapshot = [
    {
      id: 'pbc_det_packages',
      name: 'packages',
      type: 'base',
      system: false,
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      indexes: [],
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'base_price', type: 'number', required: true },
        { name: 'expected_return_days', type: 'number' },
        { name: 'description', type: 'text' },
        { name: 'default_supplies', type: 'json' },
        // PB 0.39 treats `false` as blank on PATCH when required — blocks deactivation.
        { name: 'active', type: 'bool' },
      ],
    },
  ]

  return app.importCollections(snapshot, false)
})
