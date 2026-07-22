migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')

    const pmField = col.fields.getByName('payment_method')
    if (pmField) {
      col.fields.removeById(pmField.id)
    }

    col.addIndex('idx_service_orders_placa', false, 'placa', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')

    col.removeIndex('idx_service_orders_placa')

    if (!col.fields.getByName('payment_method')) {
      col.fields.add(
        new SelectField({
          name: 'payment_method',
          values: [
            'Dinheiro',
            'Cartão de Crédito',
            'Cartão de Débito',
            'Pix',
            'Cortesia',
            'Outros',
            'Múltiplo',
          ],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
)
