routerAdd(
  'POST',
  '/backend/v1/accounts-payable/{id}/cancel-gestor',
  (e) => {
    if (!e.auth) {
      return e.unauthorizedError('Autenticação necessária')
    }

    var userRole = e.auth.getString('role')
    if (userRole !== 'Gestor de Compras') {
      return e.forbiddenError(
        'Apenas usuários com perfil "Gestor de Compras" podem executar esta operação.',
      )
    }

    var id = e.request.pathValue('id')

    var ap
    try {
      ap = $app.findRecordById('accounts_payable', id)
    } catch (_) {
      return e.notFoundError('Conta a pagar não encontrada')
    }

    var purchaseOrderId = ap.getString('purchase_order_id')
    if (!purchaseOrderId) {
      return e.badRequestError(
        'Esta conta a pagar não possui um pedido de compra vinculado. Use o fluxo de cancelamento padrão.',
      )
    }

    var receivedItemsRaw = ap.getString('received_items')
    var receivedItems = []
    try {
      receivedItems = JSON.parse(receivedItemsRaw) || []
    } catch (_) {
      receivedItems = []
    }

    if (!receivedItems.length) {
      return e.badRequestError('Nenhum item recebido encontrado para estornar.')
    }

    try {
      $app.runInTransaction(function (txApp) {
        for (var i = 0; i < receivedItems.length; i++) {
          var item = receivedItems[i]
          var itemId = item.item_id
          var returnQty = item.received_quantity

          if (!itemId || !returnQty) continue

          var poi
          try {
            poi = txApp.findRecordById('purchase_order_items', itemId)
          } catch (_) {
            throw new Error('Item do pedido de compra não encontrado: ' + itemId)
          }

          var currentReceived = poi.getFloat('received_quantity') || 0
          var newReceived = currentReceived - returnQty
          if (newReceived < 0) newReceived = 0
          poi.set('received_quantity', newReceived)
          txApp.save(poi)

          var productId = poi.getString('product_id')
          if (productId) {
            try {
              var product = txApp.findRecordById('products', productId)
              var currentStock = product.getFloat('stock_quantity') || 0
              var newStock = currentStock - returnQty
              if (newStock < 0) newStock = 0
              product.set('stock_quantity', newStock)
              txApp.save(product)
            } catch (_) {}
          }
        }

        var allItems = txApp.findRecordsByFilter(
          'purchase_order_items',
          "purchase_order_id = '" + purchaseOrderId + "'",
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
          po = txApp.findRecordById('purchase_orders', purchaseOrderId)
        } catch (_) {
          throw new Error('Pedido de compra não encontrado: ' + purchaseOrderId)
        }

        po.set('status', newStatus)
        po.set('total_amount', computedTotal)
        txApp.save(po)

        var apRecord = txApp.findRecordById('accounts_payable', id)
        txApp.delete(apRecord)
      })
    } catch (err) {
      return e.json(500, {
        error: 'Falha ao processar o estorno: ' + String(err.message || err),
      })
    }

    return e.json(200, {
      success: true,
      message: 'Conta a pagar excluída e quantidades devolvidas ao pedido de compra.',
    })
  },
  $apis.requireAuth(),
)
