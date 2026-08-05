migrate(
  (app) => {
    var vendas = app.findRecordsByFilter('vendas_avulsas', "id != ''", '-created', 0, 0)
    var arCol = app.findCollectionByNameOrId('accounts_receivable')
    var fixed = 0

    for (var i = 0; i < vendas.length; i++) {
      var venda = vendas[i]
      var vendaId = venda.id

      var existingAR = null
      try {
        existingAR = app.findFirstRecordByFilter(
          'accounts_receivable',
          'venda_avulsa_id = {:vid}',
          undefined,
          1,
          0,
          { vid: vendaId },
        )
      } catch (_) {
        existingAR = null
      }

      if (existingAR) continue

      var totalAmount = venda.get('total_amount') || 0
      var paymentMethod = venda.getString('payment_method') || ''
      var customerId = venda.getString('customer_id') || ''
      var customerDoc = venda.getString('customer_document') || ''
      var createdDate = venda.getString('created') || new Date().toISOString().split('T')[0]

      var arRecord = new Record(arCol)
      if (customerId) arRecord.set('customer_id', customerId)
      arRecord.set('venda_avulsa_id', vendaId)
      arRecord.set('description', 'Venda Avulsa - Recibo')
      arRecord.set('amount', totalAmount)
      arRecord.set('due_date', createdDate.split('T')[0])
      arRecord.set('status', 'Recebido')
      arRecord.set('payment_method', paymentMethod)
      arRecord.set('received_at', createdDate)
      if (customerDoc) {
      }
      app.save(arRecord)
      fixed++
    }

    console.log('Backfilled ' + fixed + ' missing accounts_receivable records for vendas_avulsas')
  },
  (app) => {},
)
