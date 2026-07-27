migrate(
  (app) => {
    const vendasCol = app.findCollectionByNameOrId('vendas_avulsas')
    const opCol = app.findCollectionByNameOrId('order_payments')

    if (!opCol.fields.getByName('venda_avulsa_id')) {
      opCol.fields.add(
        new RelationField({
          name: 'venda_avulsa_id',
          collectionId: vendasCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    app.save(opCol)
  },
  (app) => {
    try {
      const opCol = app.findCollectionByNameOrId('order_payments')
      const vaField = opCol.fields.getByName('venda_avulsa_id')
      if (vaField) opCol.fields.remove(vaField.getId())
      app.save(opCol)
    } catch (_) {}
  },
)
