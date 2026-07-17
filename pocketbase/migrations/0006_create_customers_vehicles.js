migrate(
  (app) => {
    const customers = new Collection({
      name: 'customers',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'social_name', type: 'text' },
        { name: 'birth_date', type: 'date' },
        { name: 'cpf', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'has_whatsapp', type: 'bool' },
        { name: 'email', type: 'email' },
        { name: 'cep', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'complement', type: 'text' },
        { name: 'neighborhood', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(customers)
    const customersCol = app.findCollectionByNameOrId('customers')
    const vehicles = new Collection({
      name: 'vehicles',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'customer_id',
          type: 'relation',
          required: true,
          collectionId: customersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Carro', 'Moto', 'Pick-up', 'Caminhonete', 'Van'],
          maxSelect: 1,
        },
        { name: 'brand', type: 'text', required: true },
        { name: 'model', type: 'text', required: true },
        { name: 'year', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(vehicles)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('vehicles'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('customers'))
    } catch (_) {}
  },
)
