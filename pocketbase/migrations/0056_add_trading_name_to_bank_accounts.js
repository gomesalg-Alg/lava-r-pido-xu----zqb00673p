migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('bank_accounts')
    if (!col.fields.getByName('trading_name')) {
      col.fields.add(new TextField({ name: 'trading_name' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('bank_accounts')
    const field = col.fields.getByName('trading_name')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)
