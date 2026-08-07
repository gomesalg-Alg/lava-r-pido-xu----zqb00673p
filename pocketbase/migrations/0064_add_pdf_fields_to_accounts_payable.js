migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('accounts_payable')
    var fields = ['nota_compra', 'boleto_pagamento', 'comprovante_pagamento']
    for (var i = 0; i < fields.length; i++) {
      var name = fields[i]
      if (!col.fields.getByName(name)) {
        col.fields.add(
          new FileField({
            name: name,
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ['application/pdf'],
          }),
        )
      }
    }
    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('accounts_payable')
    var fields = ['nota_compra', 'boleto_pagamento', 'comprovante_pagamento']
    for (var i = 0; i < fields.length; i++) {
      var field = col.fields.getByName(fields[i])
      if (field) col.fields.remove(field.getId())
    }
    app.save(col)
  },
)
