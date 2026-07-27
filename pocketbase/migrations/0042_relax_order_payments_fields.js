migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('order_payments')

    var cardFlagField = col.fields.getByName('card_flag')
    if (cardFlagField) {
      col.fields.removeById(cardFlagField.id)
    }
    if (!col.fields.getByName('card_flag')) {
      col.fields.add(new TextField({ name: 'card_flag' }))
    }

    var instField = col.fields.getByName('installments')
    if (instField) {
      col.fields.removeById(instField.id)
    }
    if (!col.fields.getByName('installments')) {
      col.fields.add(new NumberField({ name: 'installments' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('order_payments')

    var cardFlagField = col.fields.getByName('card_flag')
    if (cardFlagField) {
      col.fields.removeById(cardFlagField.id)
    }
    if (!col.fields.getByName('card_flag')) {
      col.fields.add(new SelectField({ name: 'card_flag', values: ['Visa', 'Mastercard', 'Elo'] }))
    }

    var instField = col.fields.getByName('installments')
    if (instField) {
      col.fields.removeById(instField.id)
    }
    if (!col.fields.getByName('installments')) {
      col.fields.add(new NumberField({ name: 'installments', min: 1, max: 4, onlyInt: true }))
    }

    app.save(col)
  },
)
