migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')

    if (!col.fields.getByName('placa')) {
      col.fields.add(new TextField({ name: 'placa' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')

    const placaField = col.fields.getByName('placa')
    if (placaField) {
      col.fields.remove(placaField)
    }

    app.save(col)
  },
)
