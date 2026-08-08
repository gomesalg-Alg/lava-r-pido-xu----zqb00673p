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

    if (ap.getString('status') === 'Pago') {
      return e.badRequestError('Registros com status "Pago" não podem ser cancelados.')
    }

    var poId = ap.getString('purchase_order_id')
    if (!poId) {
      return e.badRequestError(
        'Esta conta a pagar não foi gerada por um recebimento de pedido de compra.',
      )
    }

    var receivedItemsRaw = ap.getString('received_items')
    var receivedItems = []
    try {
      receivedItems = JSON.parse(receivedItemsRaw)
    } catch (_) {
      receivedItems = []
    }

    $app.runInTransaction(function (txApp) {
      for (var i = 0; i < receivedItems.length; i++) {
        var ri = receivedItems[i]
        var itemId = ri.item_id
        var recvQty = ri.received_quantity

        if (!itemId || !Number.isFinite(recvQty) || recvQty <= 0) continue

        var item
        try {
          item = txApp.findRecordById('purchase_order_items', itemId)
        } catch (_) {
          throw new Error('Item do pedido de compra não encontrado: ' + itemId)
        }

        var currentReceived = item.getFloat('received_quantity') || 0
        var newReceived = Math.max(0, currentReceived - recvQty)
        item.set('received_quantity', newReceived)
        txApp.save(item)

        var productId = item.getString('product_id')
        if (productId) {
          try {
            var product = txApp.findRecordById('products', productId)
            var currentStock = product.getFloat('stock_quantity') || 0
            product.set('stock_quantity', Math.max(0, currentStock - recvQty))
            txApp.save(product)
          } catch (_) {}
        }
      }

      var po
      try {
        po = txApp.findRecordById('purchase_orders', poId)
      } catch (_) {
        throw new Error('Pedido de compra não encontrado: ' + poId)
      }

      if (po.getString('status') === 'Cancelado') {
        throw new Error('Não é possível cancelar o recebimento de um pedido cancelado.')
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

      var newStatus = po.getString('status')
      if (allReceived && allItems.length > 0) {
        newStatus = 'Recebido'
      } else if (anyReceived) {
        newStatus = 'Parcial'
      } else {
        newStatus = 'Aberto'
      }

      po.set('status', newStatus)
      po.set('total_amount', computedTotal)
      txApp.save(po)

      txApp.delete(ap)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
