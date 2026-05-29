migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('services')

    app.truncateCollection(col)

    const services = [
      { name: 'Lavagem simples', price: 35.0, is_starting_price: true },
      { name: 'Ducha (com pretinho e secagem)', price: 20.0, is_starting_price: true },
      { name: 'Lavagem completa', price: 45.0, is_starting_price: true },
      { name: 'Aplicação de cera', price: 15.0, is_starting_price: false },
      { name: 'Polimento', price: 350.0, is_starting_price: true },
      { name: 'Lavagem de motor (parte superior)', price: 80.0, is_starting_price: false },
      { name: 'Lavagem de motor (parte inferior)', price: 80.0, is_starting_price: false },
      { name: 'Higienização', price: 250.0, is_starting_price: true },
      { name: 'Leva e trás até 1 km', price: 10.0, is_starting_price: false },
    ]

    services.forEach((s, index) => {
      const record = new Record(col)
      record.set('name', s.name)
      record.set('price', s.price)
      record.set('is_starting_price', s.is_starting_price)
      record.set('sort_order', index + 1)
      app.save(record)
    })
  },
  (app) => {},
)
