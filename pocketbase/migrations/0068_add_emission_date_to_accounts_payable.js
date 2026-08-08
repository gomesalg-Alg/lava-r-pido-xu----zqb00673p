migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('accounts_payable')
    if (!col.fields.getByName('emission_date')) {
      col.fields.add(new DateField({ name: 'emission_date' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('accounts_payable')
    const field = col.fields.getByName('emission_date')
    if (field) col.fields.remove(field.getId())
    app.save(col)
  },
)
