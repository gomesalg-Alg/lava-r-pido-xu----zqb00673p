migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vehicles')

    const typeField = col.fields.getByName('type')
    typeField.values = ['Automóvel', 'Moto', 'Pick-up', 'Caminhonete', 'Van']

    if (!col.fields.getByName('fuel')) {
      col.fields.add(new TextField({ name: 'fuel' }))
    }

    app.save(col)

    app.db().newQuery("UPDATE vehicles SET type = 'Automóvel' WHERE type = 'Carro'").execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vehicles')

    const typeField = col.fields.getByName('type')
    typeField.values = ['Carro', 'Moto', 'Pick-up', 'Caminhonete', 'Van']

    const fuelField = col.fields.getByName('fuel')
    if (fuelField) {
      col.fields.remove(fuelField)
    }

    app.save(col)

    app.db().newQuery("UPDATE vehicles SET type = 'Carro' WHERE type = 'Automóvel'").execute()
  },
)
