routerAdd(
  'POST',
  '/backend/v1/accounts-payable/{id}/cancel-receipt',
  (e) => {
    const id = e.request.pathValue('id')

    var ap
    try {
      ap = $app.findRecordById('accounts_payable', id)
    } catch (_) {
      return e.notFoundError('Conta a pagar não encontrada')
    }

    var poId = ap.getString('purchase_order_id')
    if (!poId) {
      return e.badRequestError('Esta conta a pagar não foi gerada por um recebimento de materiais')
    }

    if (ap.getString('status') === 'Pago') {
      return e.badRequestError('Contas pagas não podem ser canceladas')
    }

    var rawItems = ap.get('received_items')
    var receivedItems = []
    if (rawItems) {
      if (typeof rawItems === 'string') {
        try {
          receivedItems = JSON.parse(rawItems)
        } catch (_) {
          receivedItems = []
        }
      } else if (Array.isArray(rawItems)) {
        receivedItems = rawItems
      }
    }

    var poOrderNumber = ''
    try {
      var poRec = $app.findRecordById('purchase_orders', poId)
      poOrderNumber = poRec.getString('order_number')
    } catch (_) {
      return e.notFoundError('Pedido de compra não encontrado')
    }

    try {
      $app.runInTransaction(function (txApp) {
        for (var i = 0; i < receivedItems.length; i++) {
          var ri = receivedItems[i]
          var item
          try {
            item = txApp.findRecordById('purchase_order_items', ri.item_id)
          } catch (_) {
            continue
          }

          var currentRecv = item.getFloat('received_quantity') || 0
          var newRecv = currentRecv - ri.received_quantity
          if (newRecv < 0) newRecv = 0
          item.set('received_quantity', newRecv)

          var unitPrice = item.getFloat('unit_price') || 0
          item.set('total_price', newRecv * unitPrice)
          txApp.save(item)

          var productId = item.getString('product_id')
          if (productId) {
            try {
              var product = txApp.findRecordById('products', productId)
              var currentStock = product.getFloat('stock_quantity') || 0
              var newStock = currentStock - ri.received_quantity
              if (newStock < 0) newStock = 0
              product.set('stock_quantity', newStock)
              txApp.save(product)
            } catch (_) {}
          }
        }

        var allItems = txApp.findRecordsByFilter(
          'purchase_order_items',
          "purchase_order_id = '" + poId + "'",
          '',
          0,
          0,
        )

        var allReceived = true
        var anyReceived = false
        var computedTotal = 0

        for (var j = 0; j < allItems.length; j++) {
          var it = allItems[j]
          var qty = it.getFloat('quantity') || 0
          var recv = it.getFloat('received_quantity') || 0
          var price = it.getFloat('unit_price') || 0
          computedTotal += recv * price
          if (recv > 0) anyReceived = true
          if (recv < qty - 0.000001) allReceived = false
        }

        var newStatus = 'Aberto'
        if (allReceived && allItems.length > 0) {
          newStatus = 'Recebido'
        } else if (anyReceived) {
          newStatus = 'Parcial'
        }

        var po
        try {
          po = txApp.findRecordById('purchase_orders', poId)
        } catch (_) {
          throw new Error('Pedido de compra não encontrado')
        }
        po.set('status', newStatus)
        po.set('total_amount', computedTotal)
        txApp.save(po)

        txApp
          .db()
          .newQuery('DELETE FROM accounts_payable WHERE id = {:id}')
          .bind({ id: id })
          .execute()
      })
    } catch (err) {
      return e.internalServerError('Erro ao cancelar recebimento: ' + String(err))
    }

    return e.json(200, {
      success: true,
      message:
        'Conta a pagar cancelada, quantidades devolvidas ao pedido de compra ' +
        poOrderNumber +
        ' e status atualizado.',
    })
  },
  $apis.requireAuth(),
)
