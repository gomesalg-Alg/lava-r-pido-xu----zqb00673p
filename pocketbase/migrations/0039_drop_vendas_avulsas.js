migrate(
  (app) => {
    app
      .db()
      .newQuery("DELETE FROM service_order_items WHERE product_id IS NOT NULL AND product_id != ''")
      .execute()

    try {
      app.db().newQuery('ALTER TABLE order_payments DROP COLUMN venda_avulsa_id').execute()
    } catch (_) {}

    try {
      app.db().newQuery('ALTER TABLE accounts_receivable DROP COLUMN venda_avulsa_id').execute()
    } catch (_) {}

    try {
      var vaCol = app.findCollectionByNameOrId('vendas_avulsas')
      app.delete(vaCol)
    } catch (_) {}
  },
  (app) => {
    var customersCol = app.findCollectionByNameOrId('customers')

    var vendasAvulsas = new Collection({
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

    var opCol2 = app.findCollectionByNameOrId('order_payments')
    if (!opCol2.fields.getByName('venda_avulsa_id')) {
      opCol2.fields.add(
        new RelationField({
          name: 'venda_avulsa_id',
          collectionId: vendasAvulsas.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    app.save(opCol2)

    var arCol2 = app.findCollectionByNameOrId('accounts_receivable')
    if (!arCol2.fields.getByName('venda_avulsa_id')) {
      arCol2.fields.add(
        new RelationField({
          name: 'venda_avulsa_id',
          collectionId: vendasAvulsas.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    app.save(arCol2)
  },
)
