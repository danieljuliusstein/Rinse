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
          values: [
            'legal',
            'licensing',
            'taxes',
            'insurance',
            'vehicle',
            'marketing',
            'software',
            'equipment',
            'supplies',
            'other',
          ],
        },
        { name: 'vendor', type: 'text' },
        { name: 'notes', type: 'text' },
        {
          name: 'supply_id',
          type: 'relation',
          collectionId: 'pbc_det_supplies',
          maxSelect: 1,
        },
        { name: 'quantity', type: 'number' },
        { name: 'snapshot_qty_on_hand', type: 'number' },
        { name: 'snapshot_cost_per_unit', type: 'number' },
      ],
    },
  ]

  return app.importCollections(snapshot, false)
})
