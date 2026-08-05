migrate(
  (app) => {
    const itemsCol = app.findCollectionByNameOrId('service_order_items')

    const orderField = itemsCol.fields.getByName('order_id')
    if (orderField) {
      orderField.cascadeDelete = true
    }
    app.save(itemsCol)

    const ordersCol = app.findCollectionByNameOrId('service_orders')
    if (!ordersCol.fields.getByName('account_category_id')) {
      const categoriesCol = app.findCollectionByNameOrId('account_categories')
      ordersCol.fields.add(
        new RelationField({
          name: 'account_category_id',
          required: false,
          collectionId: categoriesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    ordersCol.addIndex('idx_service_orders_account_category_id', false, 'account_category_id', '')
    app.save(ordersCol)
  },
  (app) => {
    const ordersCol = app.findCollectionByNameOrId('service_orders')
    const acField = ordersCol.fields.getByName('account_category_id')
    if (acField) {
      ordersCol.fields.remove(acField.getId())
    }
    ordersCol.removeIndex('idx_service_orders_account_category_id')
    app.save(ordersCol)
  },
)
