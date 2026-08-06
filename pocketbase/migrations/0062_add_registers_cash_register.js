migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('bank_accounts')
    if (!col.fields.getByName('registers_cash_register')) {
      col.fields.add(new BoolField({ name: 'registers_cash_register' }))
    }
    app.save(col)

    var records = app.findRecordsByFilter('bank_accounts', "id != ''", '', 0, 0)
    for (var i = 0; i < records.length; i++) {
      if (!records[i].getBool('registers_cash_register')) {
        records[i].set('registers_cash_register', false)
        app.save(records[i])
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('bank_accounts')
    const field = col.fields.getByName('registers_cash_register')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)
