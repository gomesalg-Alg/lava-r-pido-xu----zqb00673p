migrate(
  (app) => {
    const customersCol = app.findCollectionByNameOrId('customers')

    const vendasAvulsas = new Collection({
      name: 'vendas_avulsas',
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
          required: false,
          collectionId: customersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'items', type: 'json' },
        { name: 'total_amount', type: 'number' },
        { name: 'payment_method', type: 'text' },
        { name: 'change_amount', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(vendasAvulsas)

    const opCol = app.findCollectionByNameOrId('order_payments')
    const opOrderField = opCol.fields.getByName('order_id')
    if (opOrderField) {
      opOrderField.required = false
    }
    app.save(opCol)

    const arCol = app.findCollectionByNameOrId('accounts_receivable')
    const arOrderField = arCol.fields.getByName('order_id')
    if (arOrderField) {
      arOrderField.required = false
    }
    if (!arCol.fields.getByName('venda_avulsa_id')) {
      arCol.fields.add(
        new RelationField({
          name: 'venda_avulsa_id',
          collectionId: vendasAvulsas.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    app.save(arCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('vendas_avulsas'))
    } catch (_) {}

    try {
      const opCol = app.findCollectionByNameOrId('order_payments')
      const opOrderField = opCol.fields.getByName('order_id')
      if (opOrderField) opOrderField.required = true
      app.save(opCol)
    } catch (_) {}

    try {
      const arCol = app.findCollectionByNameOrId('accounts_receivable')
      const arOrderField = arCol.fields.getByName('order_id')
      if (arOrderField) arOrderField.required = true
      const vaField = arCol.fields.getByName('venda_avulsa_id')
      if (vaField) arCol.fields.remove(vaField.getId())
      app.save(arCol)
    } catch (_) {}
  },
)
