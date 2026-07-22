migrate(
  (app) => {
    const customersCol = app.findCollectionByNameOrId('customers')
    const serviceOrdersCol = app.findCollectionByNameOrId('service_orders')

    const collection = new Collection({
      name: 'accounts_receivable',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'customer_id',
          type: 'relation',
          required: true,
          collectionId: customersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'order_id',
          type: 'relation',
          required: true,
          collectionId: serviceOrdersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'description', type: 'text' },
        { name: 'amount', type: 'number', required: true },
        { name: 'due_date', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['Pendente', 'Recebido', 'Cancelado'],
          maxSelect: 1,
        },
        { name: 'payment_method', type: 'text' },
        { name: 'received_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_accounts_receivable_order_id ON accounts_receivable (order_id)',
        'CREATE INDEX idx_accounts_receivable_status ON accounts_receivable (status)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('accounts_receivable'))
    } catch (_) {}
  },
)
