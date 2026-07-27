migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('accounts_receivable')
    var field = col.fields.getByName('customer_id')
    if (field) {
      field.required = false
    }
    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('accounts_receivable')
    var field = col.fields.getByName('customer_id')
    if (field) {
      field.required = true
    }
    app.save(col)
  },
)
