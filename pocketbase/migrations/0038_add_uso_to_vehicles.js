migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vehicles')

    if (!col.fields.getByName('uso')) {
      col.fields.add(
        new SelectField({
          name: 'uso',
          values: ['Uber', 'Táxi', 'Passeio', 'Convênio'],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vehicles')

    const usoField = col.fields.getByName('uso')
    if (usoField) {
      col.fields.remove(usoField.getId())
    }

    app.save(col)
  },
)
