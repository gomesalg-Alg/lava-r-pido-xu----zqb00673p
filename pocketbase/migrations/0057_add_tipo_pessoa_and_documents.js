migrate(
  (app) => {
    var customersCol = app.findCollectionByNameOrId('customers')
    if (!customersCol.fields.getByName('tipo_pessoa')) {
      customersCol.fields.add(
        new SelectField({
          name: 'tipo_pessoa',
          required: true,
          values: ['F', 'J'],
          maxSelect: 1,
        }),
      )
    }
    if (!customersCol.fields.getByName('cnpj')) {
      customersCol.fields.add(new TextField({ name: 'cnpj' }))
    }
    customersCol.addIndex('idx_customers_tipo_pessoa', false, 'tipo_pessoa', '')
    app.save(customersCol)

    app
      .db()
      .newQuery(
        "UPDATE customers SET tipo_pessoa = 'F' WHERE tipo_pessoa = '' OR tipo_pessoa IS NULL",
      )
      .execute()

    var suppliersCol = app.findCollectionByNameOrId('suppliers')
    if (!suppliersCol.fields.getByName('tipo_pessoa')) {
      suppliersCol.fields.add(
        new SelectField({
          name: 'tipo_pessoa',
          required: true,
          values: ['F', 'J'],
          maxSelect: 1,
        }),
      )
    }
    if (!suppliersCol.fields.getByName('cpf')) {
      suppliersCol.fields.add(new TextField({ name: 'cpf' }))
    }
    suppliersCol.addIndex('idx_suppliers_tipo_pessoa', false, 'tipo_pessoa', '')
    app.save(suppliersCol)

    app
      .db()
      .newQuery(
        "UPDATE suppliers SET tipo_pessoa = 'J' WHERE tipo_pessoa = '' OR tipo_pessoa IS NULL",
      )
      .execute()
  },
  (app) => {
    try {
      var customersCol = app.findCollectionByNameOrId('customers')
      var tp1 = customersCol.fields.getByName('tipo_pessoa')
      if (tp1) customersCol.fields.remove(tp1.getId())
      var cnpj1 = customersCol.fields.getByName('cnpj')
      if (cnpj1) customersCol.fields.remove(cnpj1.getId())
      customersCol.removeIndex('idx_customers_tipo_pessoa')
      app.save(customersCol)
    } catch (_) {}

    try {
      var suppliersCol = app.findCollectionByNameOrId('suppliers')
      var tp2 = suppliersCol.fields.getByName('tipo_pessoa')
      if (tp2) suppliersCol.fields.remove(tp2.getId())
      var cpf2 = suppliersCol.fields.getByName('cpf')
      if (cpf2) suppliersCol.fields.remove(cpf2.getId())
      suppliersCol.removeIndex('idx_suppliers_tipo_pessoa')
      app.save(suppliersCol)
    } catch (_) {}
  },
)
