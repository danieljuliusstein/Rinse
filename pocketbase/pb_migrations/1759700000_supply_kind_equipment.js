/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const snapshot = [
    {
      id: 'pbc_det_supplies',
      name: 'supplies',
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
        { name: 'unit', type: 'text', required: true },
        { name: 'quantity_on_hand', type: 'number', required: true },
        { name: 'reorder_threshold', type: 'number' },
        { name: 'cost_per_unit', type: 'number' },
        { name: 'supplier', type: 'text' },
        {
          name: 'kind',
          type: 'select',
          values: ['chemical', 'consumable', 'other'],
        },
        { name: 'notes', type: 'text' },
      ],
    },
    {
      id: 'pbc_det_equipment',
      name: 'equipment',
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
        { name: 'purchase_price', type: 'number' },
        { name: 'purchase_date', type: 'date' },
        { name: 'supplier', type: 'text' },
        { name: 'notes', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['active', 'retired'],
        },
      ],
    },
  ]

  return app.importCollections(snapshot, false)
})
