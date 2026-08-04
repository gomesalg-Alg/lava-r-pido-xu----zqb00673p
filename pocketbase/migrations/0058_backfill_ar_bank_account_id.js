migrate(
  (app) => {
    var arCol = app.findCollectionByNameOrId('accounts_receivable')

    var arRecords = app.findRecordsByFilter(
      'accounts_receivable',
      "bank_account_id = '' || bank_account_id = null",
      'created',
      0,
      0,
    )

    for (var i = 0; i < arRecords.length; i++) {
      var ar = arRecords[i]
      var orderId = ar.getString('order_id')
      var vendaId = ar.getString('venda_avulsa_id')

      var bankAccountId = ''

      if (orderId) {
        try {
          var payRecords = app.findRecordsByFilter(
            'order_payments',
            "order_id = {:orderId} && bank_account_id != '' && bank_account_id != null",
            'created',
            1,
            0,
            { orderId: orderId },
          )
          if (payRecords.length > 0) {
            bankAccountId = payRecords[0].getString('bank_account_id')
          }
        } catch (_) {}
      }

      if (!bankAccountId && vendaId) {
        try {
          var payRecords2 = app.findRecordsByFilter(
            'order_payments',
            "venda_avulsa_id = {:vendaId} && bank_account_id != '' && bank_account_id != null",
            'created',
            1,
            0,
            { vendaId: vendaId },
          )
          if (payRecords2.length > 0) {
            bankAccountId = payRecords2[0].getString('bank_account_id')
          }
        } catch (_) {}
      }

      if (bankAccountId) {
        ar.set('bank_account_id', bankAccountId)
        app.save(ar)
      }
    }
  },
  (app) => {
    // no-op — backfill is idempotent and safe to leave applied
  },
)
