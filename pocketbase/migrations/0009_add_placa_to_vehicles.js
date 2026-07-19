migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vehicles')

    if (!col.fields.getByName('placa')) {
      col.fields.add(new TextField({ name: 'placa' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vehicles')

    const placaField = col.fields.getByName('placa')
    if (placaField) {
      col.fields.remove(placaField)
    }

    app.save(col)
  },
)
