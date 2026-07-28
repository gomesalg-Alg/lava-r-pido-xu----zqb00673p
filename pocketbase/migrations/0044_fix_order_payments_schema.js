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

    app.save(col)
  },
  (app) => {},
)
