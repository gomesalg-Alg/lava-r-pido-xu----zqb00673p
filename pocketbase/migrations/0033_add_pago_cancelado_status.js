migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Em Andamento', 'Finalizado', 'Orçamento', 'Pago', 'Cancelado']
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Em Andamento', 'Finalizado', 'Orçamento']
    }
    app.save(col)
  },
)
