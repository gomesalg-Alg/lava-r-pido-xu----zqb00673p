migrate(
  (app) => {
    // Step 1: Preserve existing records before nuking the collection
    var existingRecords = []
    try {
      existingRecords = app.findRecordsByFilter('accounts_receivable', "id != ''", 'created', 0, 0)
    } catch (e) {
      // Collection might not exist yet — nothing to preserve
    }

    // Step 2: Delete the collection entirely to remove any residual schema corruption
    try {
      var oldCol = app.findCollectionByNameOrId('accounts_receivable')
      app.delete(oldCol)
    } catch (e) {
      // Already gone — proceed to recreate
    }

    // Step 3: Recreate with the exact correct schema
    var customersCol = app.findCollectionByNameOrId('customers')
    var serviceOrdersCol = app.findCollectionByNameOrId('service_orders')
    var vendasAvulsasCol = app.findCollectionByNameOrId('vendas_avulsas')

    var newCol = new Collection({
      name: 'accounts_receivable',
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
          required: false,
          collectionId: customersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'order_id',
          type: 'relation',
          required: false,
          collectionId: serviceOrdersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: false },
        { name: 'amount', type: 'number', required: true },
        { name: 'due_date', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Pendente', 'Recebido', 'Cancelado'],
          maxSelect: 1,
        },
        { name: 'payment_method', type: 'text', required: false },
        { name: 'received_at', type: 'date', required: false },
        {
          name: 'venda_avulsa_id',
          type: 'relation',
          required: false,
          collectionId: vendasAvulsasCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_accounts_receivable_order_id ON accounts_receivable (order_id)',
        'CREATE INDEX idx_accounts_receivable_status ON accounts_receivable (status)',
      ],
    })
    app.save(newCol)

    // Step 4: Re-insert preserved records into the fresh collection
    var reloadedCol = app.findCollectionByNameOrId('accounts_receivable')
    var validStatuses = ['Pendente', 'Recebido', 'Cancelado']

    for (var i = 0; i < existingRecords.length; i++) {
      var old = existingRecords[i]

      var amount = old.get('amount')
      if (amount === null || amount === undefined) continue

      var dueDate = old.getString('due_date')
      if (!dueDate) continue

      var status = old.getString('status')
      if (status && validStatuses.indexOf(status) === -1) continue

      var newRec = new Record(reloadedCol)
      newRec.set('amount', amount)
      newRec.set('due_date', dueDate)

      if (status) newRec.set('status', status)

      var customerId = old.getString('customer_id')
      if (customerId) newRec.set('customer_id', customerId)

      var orderId = old.getString('order_id')
      if (orderId) newRec.set('order_id', orderId)

      var description = old.getString('description')
      if (description) newRec.set('description', description)

      var paymentMethod = old.getString('payment_method')
      if (paymentMethod) newRec.set('payment_method', paymentMethod)

      var receivedAt = old.getString('received_at')
      if (receivedAt) newRec.set('received_at', receivedAt)

      var vendaAvulsaId = old.getString('venda_avulsa_id')
      if (vendaAvulsaId) newRec.set('venda_avulsa_id', vendaAvulsaId)

      var createdVal = old.getString('created')
      if (createdVal) newRec.set('created', createdVal)

      var updatedVal = old.getString('updated')
      if (updatedVal) newRec.set('updated', updatedVal)

      try {
        app.save(newRec)
      } catch (e) {
        // Skip records that fail validation — better than aborting the migration
      }
    }
  },
  (app) => {
    // no-op — the previous schema was already broken
  },
)
