migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('accounts_payable')

    if (!col.fields.getByName('payment_method_code')) {
      col.fields.add(
        new SelectField({
          name: 'payment_method_code',
          required: false,
          values: [
            '01-Dinheiro',
            '02-Pix',
            '03-Transferência Bancária',
            '04-Depósito em Conta',
            '05-Cartão de Crédito',
            '06-Cartão de Débito',
          ],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('accounts_payable')
    var f = col.fields.getByName('payment_method_code')
    if (f) col.fields.remove(f.getId())
    app.save(col)
  },
)
