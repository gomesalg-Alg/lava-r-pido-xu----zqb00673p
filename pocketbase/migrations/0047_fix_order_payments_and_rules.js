migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('order_payments')

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    // Force method: single select, required
    var methodField = col.fields.getByName('method')
    if (methodField) {
      col.fields.removeById(methodField.id)
    }
    col.fields.add(
      new SelectField({
        name: 'method',
        required: true,
        values: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Cortesia', 'Outros'],
        maxSelect: 1,
      }),
    )

    // Force amount: number, required
    var amountField = col.fields.getByName('amount')
    if (amountField) {
      col.fields.removeById(amountField.id)
    }
    col.fields.add(
      new NumberField({
        name: 'amount',
        required: true,
      }),
    )

    // Force card_flag: text, optional
    var cardFlagField = col.fields.getByName('card_flag')
    if (cardFlagField) {
      col.fields.removeById(cardFlagField.id)
    }
    col.fields.add(new TextField({ name: 'card_flag', required: false }))

    // Force installments: number, optional
    var instField = col.fields.getByName('installments')
    if (instField) {
      col.fields.removeById(instField.id)
    }
    col.fields.add(new NumberField({ name: 'installments', required: false }))

    // Force applied_rate: number, optional
    var arField = col.fields.getByName('applied_rate')
    if (arField) {
      col.fields.removeById(arField.id)
    }
    col.fields.add(new NumberField({ name: 'applied_rate', required: false }))

    // Force fee_amount: number, optional
    var faField = col.fields.getByName('fee_amount')
    if (faField) {
      col.fields.removeById(faField.id)
    }
    col.fields.add(new NumberField({ name: 'fee_amount', required: false }))

    // Force order_id: relation to service_orders, optional
    var orderCol = app.findCollectionByNameOrId('service_orders')
    var orderField = col.fields.getByName('order_id')
    if (orderField) {
      col.fields.removeById(orderField.id)
    }
    col.fields.add(
      new RelationField({
        name: 'order_id',
        collectionId: orderCol.id,
        cascadeDelete: false,
        maxSelect: 1,
        required: false,
      }),
    )

    // Force venda_avulsa_id: relation to vendas_avulsas, optional
    var vaCol = app.findCollectionByNameOrId('vendas_avulsas')
    var vaField = col.fields.getByName('venda_avulsa_id')
    if (vaField) {
      col.fields.removeById(vaField.id)
    }
    col.fields.add(
      new RelationField({
        name: 'venda_avulsa_id',
        collectionId: vaCol.id,
        cascadeDelete: false,
        maxSelect: 1,
        required: false,
      }),
    )

    app.save(col)
  },
  (app) => {},
)
