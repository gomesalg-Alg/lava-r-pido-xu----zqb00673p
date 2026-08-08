migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('accounts_payable')
    var poCol = app.findCollectionByNameOrId('purchase_orders')

    if (!col.fields.getByName('purchase_order_id')) {
      col.fields.add(
        new RelationField({
          name: 'purchase_order_id',
          required: false,
          collectionId: poCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('received_items')) {
      col.fields.add(new JSONField({ name: 'received_items' }))
    }

    col.addIndex('idx_accounts_payable_purchase_order_id', false, 'purchase_order_id', '')

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('accounts_payable')
    var f1 = col.fields.getByName('purchase_order_id')
    if (f1) col.fields.remove(f1.getId())
    var f2 = col.fields.getByName('received_items')
    if (f2) col.fields.remove(f2.getId())
    col.removeIndex('idx_accounts_payable_purchase_order_id')
    app.save(col)
  },
)
