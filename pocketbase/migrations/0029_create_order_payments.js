migrate(
  (app) => {
    const soCol = app.findCollectionByNameOrId('service_orders')
    const pmField = soCol.fields.getByName('payment_method')
    if (pmField) {
      pmField.values = [
        'Dinheiro',
        'Cartão de Crédito',
        'Cartão de Débito',
        'Pix',
        'Cortesia',
        'Outros',
        'Múltiplo',
      ]
    }
    app.save(soCol)

    const opCol = new Collection({
      name: 'order_payments',
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
          collectionId: app.findCollectionByNameOrId('service_orders').id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'method',
          type: 'select',
          values: [
            'Dinheiro',
            'Cartão de Crédito',
            'Cartão de Débito',
            'Pix',
            'Cortesia',
            'Outros',
          ],
        },
        { name: 'amount', type: 'number' },
        { name: 'card_flag', type: 'select', values: ['Visa', 'Mastercard', 'Elo'] },
        { name: 'installments', type: 'number', min: 1, max: 4, onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_order_payments_order_id ON order_payments (order_id)'],
    })
    app.save(opCol)
  },
  (app) => {
    try {
      const opCol = app.findCollectionByNameOrId('order_payments')
      app.delete(opCol)
    } catch (_) {}

    const soCol = app.findCollectionByNameOrId('service_orders')
    const pmField = soCol.fields.getByName('payment_method')
    if (pmField) {
      pmField.values = [
        'Dinheiro',
        'Cartão de Crédito',
        'Cartão de Débito',
        'Pix',
        'Cortesia',
        'Outros',
      ]
    }
    app.save(soCol)
  },
)
