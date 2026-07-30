migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('accounts_receivable')

    if (!col.fields.getByName('discount_amount')) {
      col.fields.add(new NumberField({ name: 'discount_amount', required: false }))
    }

    if (!col.fields.getByName('surcharge_amount')) {
      col.fields.add(new NumberField({ name: 'surcharge_amount', required: false }))
    }

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('accounts_receivable')

    var discountField = col.fields.getByName('discount_amount')
    if (discountField) {
      col.fields.remove(discountField)
    }

    var surchargeField = col.fields.getByName('surcharge_amount')
    if (surchargeField) {
      col.fields.remove(surchargeField)
    }

    app.save(col)
  },
)
