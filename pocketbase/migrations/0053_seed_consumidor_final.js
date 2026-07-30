migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('customers')

    try {
      app.findFirstRecordByData('customers', 'name', 'Consumidor Final')
    } catch (_) {
      const record = new Record(col)
      record.set('name', 'Consumidor Final')
      app.save(record)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('customers', 'name', 'Consumidor Final')
      app.delete(record)
    } catch (_) {}
  },
)
