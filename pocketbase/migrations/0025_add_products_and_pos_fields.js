migrate(
  (app) => {
    const products = new Collection({
      name: 'products',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'number' },
        { name: 'sku', type: 'text' },
        { name: 'stock_quantity', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(products)

    const itemsCol = app.findCollectionByNameOrId('service_order_items')
    if (!itemsCol.fields.getByName('product_id')) {
      itemsCol.fields.add(
        new RelationField({
          name: 'product_id',
          collectionId: products.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    var serviceField = itemsCol.fields.getByName('service_id')
    if (serviceField) {
      serviceField.required = false
    }
    var operatorField = itemsCol.fields.getByName('operator_id')
    if (operatorField) {
      operatorField.required = false
    }
    app.save(itemsCol)

    var ordersCol = app.findCollectionByNameOrId('service_orders')
    var paymentField = ordersCol.fields.getByName('payment_method')
    if (paymentField) {
      paymentField.values = [
        'Dinheiro',
        'Cartão de Crédito',
        'Cartão de Débito',
        'Pix',
        'Cortesia',
        'Outros',
      ]
    }
    if (!ordersCol.fields.getByName('total_discount')) {
      ordersCol.fields.add(new NumberField({ name: 'total_discount' }))
    }
    if (!ordersCol.fields.getByName('total_surcharge')) {
      ordersCol.fields.add(new NumberField({ name: 'total_surcharge' }))
    }
    if (!ordersCol.fields.getByName('amount_paid')) {
      ordersCol.fields.add(new NumberField({ name: 'amount_paid' }))
    }
    app.save(ordersCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('products'))
    } catch (_) {}

    try {
      var itemsCol = app.findCollectionByNameOrId('service_order_items')
      var pid = itemsCol.fields.getByName('product_id')
      if (pid) itemsCol.fields.remove(pid.getId())
      var sf = itemsCol.fields.getByName('service_id')
      if (sf) sf.required = true
      var of = itemsCol.fields.getByName('operator_id')
      if (of) of.required = true
      app.save(itemsCol)
    } catch (_) {}

    try {
      var ordersCol = app.findCollectionByNameOrId('service_orders')
      var pf = ordersCol.fields.getByName('payment_method')
      if (pf) {
        pf.values = ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito']
      }
      var td = ordersCol.fields.getByName('total_discount')
      if (td) ordersCol.fields.remove(td.getId())
      var ts = ordersCol.fields.getByName('total_surcharge')
      if (ts) ordersCol.fields.remove(ts.getId())
      var ap = ordersCol.fields.getByName('amount_paid')
      if (ap) ordersCol.fields.remove(ap.getId())
      app.save(ordersCol)
    } catch (_) {}
  },
)
