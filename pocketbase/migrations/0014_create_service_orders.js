migrate(
  (app) => {
    const customersCol = app.findCollectionByNameOrId('customers')
    const vehiclesCol = app.findCollectionByNameOrId('vehicles')
    const servicesCol = app.findCollectionByNameOrId('services')

    const serviceOrders = new Collection({
      name: 'service_orders',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'ticket_number', type: 'number', onlyInt: true },
        { name: 'prisma_number', type: 'text' },
        {
          name: 'customer_id',
          type: 'relation',
          required: true,
          collectionId: customersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'vehicle_id',
          type: 'relation',
          required: true,
          collectionId: vehiclesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'emission_date', type: 'date' },
        { name: 'entry_at', type: 'date' },
        { name: 'exit_at', type: 'date' },
        {
          name: 'photo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/png', 'image/jpeg'],
        },
        {
          name: 'payment_method',
          type: 'select',
          values: ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['Em Andamento', 'Finalizado', 'Orçamento'],
          maxSelect: 1,
        },
        { name: 'observation', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(serviceOrders)

    const serviceOrdersCol = app.findCollectionByNameOrId('service_orders')

    const serviceOrderItems = new Collection({
      name: 'service_order_items',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'order_id',
          type: 'relation',
          required: true,
          collectionId: serviceOrdersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'service_id',
          type: 'relation',
          required: true,
          collectionId: servicesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'operator_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'quantity', type: 'number', onlyInt: true },
        { name: 'unit_price', type: 'number' },
        { name: 'discount_amount', type: 'number' },
        { name: 'discount_reason', type: 'text' },
        { name: 'surcharge_amount', type: 'number' },
        { name: 'surcharge_reason', type: 'text' },
        { name: 'total_price', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(serviceOrderItems)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('service_order_items'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('service_orders'))
    } catch (_) {}
  },
)
