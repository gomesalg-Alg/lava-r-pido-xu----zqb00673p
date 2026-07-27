migrate(
  (app) => {
    var vendasCol
    try {
      vendasCol = app.findCollectionByNameOrId('vendas_avulsas')
    } catch (_) {
      var customersCol = app.findCollectionByNameOrId('customers')
      vendasCol = new Collection({
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
      app.save(vendasCol)
      vendasCol = app.findCollectionByNameOrId('vendas_avulsas')
    }

    var itemsCol = app.findCollectionByNameOrId('service_order_items')
    if (!itemsCol.fields.getByName('product_id')) {
      var productsCol = app.findCollectionByNameOrId('products')
      itemsCol.fields.add(
        new RelationField({
          name: 'product_id',
          collectionId: productsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    var svcField = itemsCol.fields.getByName('service_id')
    if (svcField) {
      svcField.required = false
    }
    app.save(itemsCol)

    var opCol = app.findCollectionByNameOrId('order_payments')
    if (!opCol.fields.getByName('venda_avulsa_id')) {
      opCol.fields.add(
        new RelationField({
          name: 'venda_avulsa_id',
          collectionId: vendasCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    var opOrderField = opCol.fields.getByName('order_id')
    if (opOrderField) {
      opOrderField.required = false
    }
    app.save(opCol)

    var arCol = app.findCollectionByNameOrId('accounts_receivable')
    if (!arCol.fields.getByName('venda_avulsa_id')) {
      arCol.fields.add(
        new RelationField({
          name: 'venda_avulsa_id',
          collectionId: vendasCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    var arOrderField = arCol.fields.getByName('order_id')
    if (arOrderField) {
      arOrderField.required = false
    }
    app.save(arCol)
  },
  (app) => {},
)
