migrate(
  (app) => {
    var suppliersCol = app.findCollectionByNameOrId('suppliers')

    var purchaseOrders = new Collection({
      name: 'purchase_orders',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'supplier_id',
          type: 'relation',
          required: true,
          collectionId: suppliersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'order_number', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['Aberto', 'Recebido', 'Parcial', 'Cancelado'],
          maxSelect: 1,
        },
        { name: 'emission_date', type: 'date' },
        { name: 'expected_date', type: 'date' },
        { name: 'observation', type: 'text' },
        { name: 'total_amount', type: 'number' },
        {
          name: 'created_by',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_purchase_orders_order_number ON purchase_orders (order_number)',
        'CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders (supplier_id)',
        'CREATE INDEX idx_purchase_orders_status ON purchase_orders (status)',
      ],
    })
    app.save(purchaseOrders)

    var poCol = app.findCollectionByNameOrId('purchase_orders')
    var productsCol = app.findCollectionByNameOrId('products')

    var purchaseOrderItems = new Collection({
      name: 'purchase_order_items',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'purchase_order_id',
          type: 'relation',
          required: true,
          collectionId: poCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'product_id',
          type: 'relation',
          required: true,
          collectionId: productsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'quantity', type: 'number' },
        { name: 'received_quantity', type: 'number' },
        { name: 'unit_price', type: 'number' },
        { name: 'total_price', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_purchase_order_items_purchase_order_id ON purchase_order_items (purchase_order_id)',
        'CREATE INDEX idx_purchase_order_items_product_id ON purchase_order_items (product_id)',
      ],
    })
    app.save(purchaseOrderItems)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('purchase_order_items'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('purchase_orders'))
    } catch (_) {}
  },
)
