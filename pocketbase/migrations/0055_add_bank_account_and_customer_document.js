migrate(
  (app) => {
    var opCol = app.findCollectionByNameOrId('order_payments')
    if (!opCol.fields.getByName('bank_account_id')) {
      var bankCol = app.findCollectionByNameOrId('bank_accounts')
      opCol.fields.add(
        new RelationField({
          name: 'bank_account_id',
          collectionId: bankCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    opCol.addIndex('idx_order_payments_bank_account_id', false, 'bank_account_id', '')
    app.save(opCol)

    var vaCol = app.findCollectionByNameOrId('vendas_avulsas')
    if (!vaCol.fields.getByName('customer_document')) {
      vaCol.fields.add(
        new TextField({
          name: 'customer_document',
        }),
      )
    }
    app.save(vaCol)
  },
  (app) => {
    try {
      var opCol = app.findCollectionByNameOrId('order_payments')
      var baField = opCol.fields.getByName('bank_account_id')
      if (baField) opCol.fields.remove(baField.getId())
      opCol.removeIndex('idx_order_payments_bank_account_id')
      app.save(opCol)
    } catch (_) {}

    try {
      var vaCol = app.findCollectionByNameOrId('vendas_avulsas')
      var cdField = vaCol.fields.getByName('customer_document')
      if (cdField) vaCol.fields.remove(cdField.getId())
      app.save(vaCol)
    } catch (_) {}
  },
)
