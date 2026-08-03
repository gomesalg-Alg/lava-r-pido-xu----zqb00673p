migrate(
  (app) => {
    const bankAccountsCol = new Collection({
      name: 'bank_accounts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'agency', type: 'text', required: true },
        { name: 'account_number', type: 'text', required: true },
        {
          name: 'account_type',
          type: 'select',
          required: true,
          values: ['Corrente', 'Poupança'],
          maxSelect: 1,
        },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_bank_accounts_is_active ON bank_accounts (is_active)'],
    })
    app.save(bankAccountsCol)

    const arCol = app.findCollectionByNameOrId('accounts_receivable')
    if (!arCol.fields.getByName('bank_account_id')) {
      const bankCol = app.findCollectionByNameOrId('bank_accounts')
      arCol.fields.add(
        new RelationField({
          name: 'bank_account_id',
          required: false,
          collectionId: bankCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    arCol.addIndex('idx_accounts_receivable_bank_account_id', false, 'bank_account_id', '')
    app.save(arCol)

    const suppliersCol = app.findCollectionByNameOrId('suppliers')
    const bankCol2 = app.findCollectionByNameOrId('bank_accounts')

    const apCol = new Collection({
      name: 'accounts_payable',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'supplier_id',
          type: 'relation',
          required: false,
          collectionId: suppliersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'due_date', type: 'date' },
        { name: 'status', type: 'select', values: ['Pendente', 'Pago', 'Cancelado'], maxSelect: 1 },
        { name: 'payment_method', type: 'text' },
        { name: 'paid_at', type: 'date' },
        {
          name: 'bank_account_id',
          type: 'relation',
          required: false,
          collectionId: bankCol2.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'discount_amount', type: 'number' },
        { name: 'surcharge_amount', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_accounts_payable_supplier_id ON accounts_payable (supplier_id)',
        'CREATE INDEX idx_accounts_payable_bank_account_id ON accounts_payable (bank_account_id)',
        'CREATE INDEX idx_accounts_payable_status ON accounts_payable (status)',
        'CREATE INDEX idx_accounts_payable_due_date ON accounts_payable (due_date)',
      ],
    })
    app.save(apCol)

    var baCol = app.findCollectionByNameOrId('bank_accounts')
    var seeds = [
      {
        name: 'Banco do Brasil',
        agency: '1234-5',
        account_number: '67890-1',
        account_type: 'Corrente',
        is_active: true,
      },
      {
        name: 'Caixa Econômica Federal',
        agency: '9876-5',
        account_number: '54321-0',
        account_type: 'Poupança',
        is_active: true,
      },
    ]
    for (var i = 0; i < seeds.length; i++) {
      var s = seeds[i]
      try {
        app.findFirstRecordByData('bank_accounts', 'account_number', s.account_number)
      } catch (_) {
        var rec = new Record(baCol)
        rec.set('name', s.name)
        rec.set('agency', s.agency)
        rec.set('account_number', s.account_number)
        rec.set('account_type', s.account_type)
        rec.set('is_active', s.is_active)
        app.save(rec)
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('accounts_payable'))
    } catch (_) {}
    try {
      var arCol = app.findCollectionByNameOrId('accounts_receivable')
      var field = arCol.fields.getByName('bank_account_id')
      if (field) arCol.fields.remove(field)
      arCol.removeIndex('idx_accounts_receivable_bank_account_id')
      app.save(arCol)
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('bank_accounts'))
    } catch (_) {}
  },
)
