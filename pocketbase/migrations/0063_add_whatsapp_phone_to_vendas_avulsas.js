migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vendas_avulsas')
    if (!col.fields.getByName('whatsapp_phone')) {
      col.fields.add(new TextField({ name: 'whatsapp_phone' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vendas_avulsas')
    const field = col.fields.getByName('whatsapp_phone')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)
