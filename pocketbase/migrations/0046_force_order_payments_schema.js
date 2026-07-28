migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('order_payments')

    // Force method: select (single), required, correct values
    var methodField = col.fields.getByName('method')
    if (methodField) {
      col.fields.removeById(methodField.id)
    }
    if (!col.fields.getByName('method')) {
      col.fields.add(
        new SelectField({
          name: 'method',
          required: true,
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

    // Force card_flag: text, not required
    var cardFlagField = col.fields.getByName('card_flag')
    if (cardFlagField && cardFlagField.type !== 'text') {
      col.fields.removeById(cardFlagField.id)
    }
    if (!col.fields.getByName('card_flag')) {
      col.fields.add(new TextField({ name: 'card_flag' }))
    }

    // Force order_id: relation to service_orders, not required
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

    // Force venda_avulsa_id: relation to vendas_avulsas, not required
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

    // Force installments: number, not required
    var instField = col.fields.getByName('installments')
    if (instField) {
      col.fields.removeById(instField.id)
    }
    if (!col.fields.getByName('installments')) {
      col.fields.add(new NumberField({ name: 'installments' }))
    }

    // Force applied_rate: number, not required
    var arField = col.fields.getByName('applied_rate')
    if (arField) {
      col.fields.removeById(arField.id)
    }
    if (!col.fields.getByName('applied_rate')) {
      col.fields.add(new NumberField({ name: 'applied_rate' }))
    }

    // Force fee_amount: number, not required
    var faField = col.fields.getByName('fee_amount')
    if (faField) {
      col.fields.removeById(faField.id)
    }
    if (!col.fields.getByName('fee_amount')) {
      col.fields.add(new NumberField({ name: 'fee_amount' }))
    }

    app.save(col)
  },
  (app) => {},
)
