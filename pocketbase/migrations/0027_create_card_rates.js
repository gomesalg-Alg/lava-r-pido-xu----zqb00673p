migrate(
  (app) => {
    const collection = new Collection({
      name: 'card_rates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role = 'Administrador'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'Administrador'",
      fields: [
        { name: 'flag', type: 'select', required: true, values: ['Visa', 'Mastercard', 'Elo'] },
        { name: 'debit_rate', type: 'number' },
        { name: 'credit_1x_rate', type: 'number' },
        { name: 'credit_2x_rate', type: 'number' },
        { name: 'credit_3x_rate', type: 'number' },
        { name: 'credit_4x_rate', type: 'number' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_card_rates_flag ON card_rates (flag)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('card_rates')
    app.delete(collection)
  },
)
