migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('order_payments')

    var cardFlagField = col.fields.getByName('card_flag')
    if (cardFlagField && cardFlagField.type !== 'text') {
      col.fields.removeById(cardFlagField.id)
    }
    if (!col.fields.getByName('card_flag')) {
      col.fields.add(new TextField({ name: 'card_flag' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('order_payments')

    var cardFlagField = col.fields.getByName('card_flag')
    if (cardFlagField && cardFlagField.type !== 'text') {
      col.fields.removeById(cardFlagField.id)
    }
    if (!col.fields.getByName('card_flag')) {
      col.fields.add(new TextField({ name: 'card_flag' }))
    }

    app.save(col)
  },
)
