migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('order_payments')

    if (!col.fields.getByName('applied_rate')) {
      col.fields.add(new NumberField({ name: 'applied_rate' }))
    }

    if (!col.fields.getByName('fee_amount')) {
      col.fields.add(new NumberField({ name: 'fee_amount' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('order_payments')

    const arField = col.fields.getByName('applied_rate')
    if (arField) {
      col.fields.removeById(arField.id)
    }

    const faField = col.fields.getByName('fee_amount')
    if (faField) {
      col.fields.removeById(faField.id)
    }

    app.save(col)
  },
)
