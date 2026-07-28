migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('order_payments')

    var orderField = col.fields.getByName('order_id')
    if (orderField) {
      col.fields.removeById(orderField.id)
    }
    if (!col.fields.getByName('order_id')) {
      col.fields.add(
        new RelationField({
          name: 'order_id',
          collectionId: app.findCollectionByNameOrId('service_orders').id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }

    var methodField = col.fields.getByName('method')
    if (methodField) {
      col.fields.removeById(methodField.id)
    }
    if (!col.fields.getByName('method')) {
      col.fields.add(
        new SelectField({
          name: 'method',
          values: [
            'Dinheiro',
            'Cartão de Crédito',
            'Cartão de Débito',
            'Pix',
            'Cortesia',
            'Outros',
          ],
          maxSelect: 1,
        }),
      )
    }

    var cardFlagField = col.fields.getByName('card_flag')
    if (cardFlagField && cardFlagField.type !== 'text') {
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

    var arField = col.fields.getByName('applied_rate')
    if (arField) {
      col.fields.removeById(arField.id)
    }
    if (!col.fields.getByName('applied_rate')) {
      col.fields.add(new NumberField({ name: 'applied_rate' }))
    }

    var faField = col.fields.getByName('fee_amount')
    if (faField) {
      col.fields.removeById(faField.id)
    }
    if (!col.fields.getByName('fee_amount')) {
      col.fields.add(new NumberField({ name: 'fee_amount' }))
    }

    var vaField = col.fields.getByName('venda_avulsa_id')
    if (vaField) {
      col.fields.removeById(vaField.id)
    }
    if (!col.fields.getByName('venda_avulsa_id')) {
      col.fields.add(
        new RelationField({
          name: 'venda_avulsa_id',
          collectionId: app.findCollectionByNameOrId('vendas_avulsas').id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {},
)
