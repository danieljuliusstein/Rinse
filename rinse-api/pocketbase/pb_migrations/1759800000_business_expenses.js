/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const snapshot = [
    {
      id: 'pbc_det_bizexp',
      name: 'business_expenses',
      type: 'base',
      system: false,
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      indexes: [],
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        {
          name: 'category',
          type: 'select',
          values: ['legal', 'licensing', 'taxes', 'insurance', 'vehicle', 'marketing', 'software', 'equipment', 'other'],
        },
        { name: 'vendor', type: 'text' },
        { name: 'notes', type: 'text' },
      ],
    },
  ]

  return app.importCollections(snapshot, false)
})
