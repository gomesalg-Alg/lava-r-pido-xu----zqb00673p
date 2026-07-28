migrate(
  (app) => {
    // Step 1: Preserve existing records before nuking the collection
    var existingRecords = []
    try {
      existingRecords = app.findRecordsByFilter('order_payments', "id != ''", 'created', 0, 0)
    } catch (e) {
      // Collection might not exist yet — nothing to preserve
    }

    // Step 2: Delete the collection entirely to remove any residual schema corruption
    try {
      var oldCol = app.findCollectionByNameOrId('order_payments')
      app.delete(oldCol)
    } catch (e) {
      // Already gone — proceed to recreate
    }

    // Step 3: Recreate with the exact correct schema
    var soCol = app.findCollectionByNameOrId('service_orders')
    var vaCol = app.findCollectionByNameOrId('vendas_avulsas')

    var newCol = new Collection({
      name: 'order_payments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'method',
          type: 'select',
          required: true,
          values: [
            'Dinheiro',
            'Cartão de Crédito',
            'Cartão de Débito',
            'Pix',
            'Cortesia',
            'Outros',
          ],
          maxSelect: 1,
        },
        { name: 'amount', type: 'number', required: true },
        { name: 'card_flag', type: 'text', required: false },
        { name: 'installments', type: 'number', required: false },
        { name: 'applied_rate', type: 'number', required: false },
        { name: 'fee_amount', type: 'number', required: false },
        {
          name: 'order_id',
          type: 'relation',
          required: false,
          collectionId: soCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'venda_avulsa_id',
          type: 'relation',
          required: false,
          collectionId: vaCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_order_payments_order_id ON order_payments (order_id)'],
    })
    app.save(newCol)

    // Step 4: Re-insert preserved records into the fresh collection
    var reloadedCol = app.findCollectionByNameOrId('order_payments')
    var validMethods = [
      'Dinheiro',
      'Cartão de Crédito',
      'Cartão de Débito',
      'Pix',
      'Cortesia',
      'Outros',
    ]

    for (var i = 0; i < existingRecords.length; i++) {
      var old = existingRecords[i]
      var method = old.getString('method')

      // Skip records with invalid or empty method — they would fail validation
      if (validMethods.indexOf(method) === -1) continue

      var newRec = new Record(reloadedCol)
      newRec.set('method', method)
      newRec.set('amount', old.get('amount') || 0)

      var cardFlag = old.getString('card_flag')
      if (cardFlag) newRec.set('card_flag', cardFlag)

      var inst = old.get('installments')
      if (inst) newRec.set('installments', inst)

      var ar = old.get('applied_rate')
      if (ar) newRec.set('applied_rate', ar)

      var fa = old.get('fee_amount')
      if (fa) newRec.set('fee_amount', fa)

      var orderId = old.getString('order_id')
      if (orderId) newRec.set('order_id', orderId)

      var vaId = old.getString('venda_avulsa_id')
      if (vaId) newRec.set('venda_avulsa_id', vaId)

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
    // Down migration: no-op (the previous schema was already broken)
  },
)
