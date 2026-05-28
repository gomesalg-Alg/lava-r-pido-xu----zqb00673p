migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('services')
    const seeds = [
      {
        name: 'Lavagem simples',
        price: 35.0,
        description: '',
        is_starting_price: true,
        sort_order: 1,
      },
      {
        name: 'Ducha',
        price: 20.0,
        description: 'com pretinho e secagem',
        is_starting_price: true,
        sort_order: 2,
      },
      {
        name: 'Lavagem completa',
        price: 45.0,
        description: '',
        is_starting_price: true,
        sort_order: 3,
      },
      {
        name: 'Aplicação de cera',
        price: 15.0,
        description: '',
        is_starting_price: false,
        sort_order: 4,
      },
      { name: 'Polimento', price: 350.0, description: '', is_starting_price: true, sort_order: 5 },
      {
        name: 'Lavagem de motor',
        price: 80.0,
        description: 'parte superior',
        is_starting_price: false,
        sort_order: 6,
      },
      {
        name: 'Lavagem inferior',
        price: 80.0,
        description: '',
        is_starting_price: false,
        sort_order: 7,
      },
      {
        name: 'Higienização',
        price: 250.0,
        description: '',
        is_starting_price: true,
        sort_order: 8,
      },
      {
        name: 'Avaliação de serviços',
        price: 0.0,
        description: 'no local',
        is_starting_price: false,
        sort_order: 9,
      },
      {
        name: 'Leva e trás até 1 km',
        price: 10.0,
        description: '',
        is_starting_price: false,
        sort_order: 10,
      },
    ]

    for (const s of seeds) {
      try {
        app.findFirstRecordByData('services', 'name', s.name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', s.name)
        record.set('price', s.price)
        record.set('description', s.description)
        record.set('is_starting_price', s.is_starting_price)
        record.set('sort_order', s.sort_order)
        app.save(record)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('services')
    const records = app.findRecordsByFilter('services', "name != ''", '', 100, 0)
    for (const r of records) {
      app.delete(r)
    }
  },
)
