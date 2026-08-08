routerAdd(
  'POST',
  '/backend/v1/purchase-orders/{id}/receive',
  (e) => {
    function toNum(val) {
      var n = Number(val)
      if (isNaN(n) || !isFinite(n)) return 0
      return n
    }

    try {
      var id = e.request.pathValue('id')
      var body = e.requestInfo().body || {}
      var itemUpdates = body.items || []
      var bankAccountId = body.bank_account_id || ''
      var dueDate = body.due_date || ''

      if (!id) {
        return e.json(400, { message: 'ID do pedido não informado' })
      }

      if (!itemUpdates || itemUpdates.length === 0) {
        return e.json(400, { message: 'Nenhum item informado para recebimento' })
      }

      var po = $app.findRecordById('purchase_orders', id)
      var poStatus = po.get('status') || ''

      if (poStatus === 'Cancelado') {
        return e.json(400, { message: 'Pedido cancelado não pode ser recebido' })
      }
      if (poStatus === 'Recebido') {
        return e.json(400, { message: 'Pedido já foi totalmente recebido' })
      }

      var poItems = $app.findRecordsByFilter(
        'purchase_order_items',
        "purchase_order_id = '" + id + "'",
        '',
        200,
        0,
      )

      var totalReceivedAmount = 0
      var allFullyReceived = true
      var anyReceived = false

      for (var i = 0; i < itemUpdates.length; i++) {
        var update = itemUpdates[i]
        if (!update || !update.item_id) continue

        var newReceived = toNum(update.received_quantity)
        if (newReceived < 0) {
          return e.json(400, { message: 'Quantidade inválida informada para um item' })
        }

        var item = null
        for (var j = 0; j < poItems.length; j++) {
          if (poItems[j].id === update.item_id) {
            item = poItems[j]
            break
          }
        }
        if (!item) continue

        var orderedQty = toNum(item.get('quantity'))
        var currentReceived = toNum(item.get('received_quantity'))

        if (newReceived < currentReceived) {
          return e.json(400, { message: 'Não é possível reduzir a quantidade recebida' })
        }
        if (orderedQty > 0 && newReceived > orderedQty) {
          return e.json(400, {
            message: 'Quantidade recebida excede a quantidade pedida para o item',
          })
        }

        var delta = newReceived - currentReceived
        if (delta <= 0) continue

        try {
          item.set('received_quantity', newReceived)
          $app.save(item)
        } catch (saveErr) {
          return e.json(400, { message: 'Erro ao salvar item do pedido: ' + String(saveErr) })
        }

        var productId = item.get('product_id')
        if (productId) {
          try {
            var product = $app.findRecordById('products', productId)
            var currentStock = toNum(product.get('stock_quantity'))
            product.set('stock_quantity', currentStock + delta)
            $app.save(product)
          } catch (stockErr) {
            $app
              .logger()
              .error('stock update failed', 'productId', productId, 'error', String(stockErr))
          }
        }

        var unitPrice = toNum(item.get('unit_price'))
        totalReceivedAmount += delta * unitPrice

        if (orderedQty > 0 && newReceived < orderedQty) allFullyReceived = false
        anyReceived = true
      }

      if (!anyReceived) {
        return e.json(400, { message: 'Nenhuma quantidade nova para receber' })
      }

      try {
        po.set('status', allFullyReceived ? 'Recebido' : 'Parcial')
        $app.save(po)
      } catch (poErr) {
        return e.json(400, { message: 'Erro ao atualizar status do pedido: ' + String(poErr) })
      }

      if (totalReceivedAmount > 0) {
        try {
          var apCol = $app.findCollectionByNameOrId('accounts_payable')
          var ap = new Record(apCol)
          var supplierId = po.get('supplier_id')
          if (supplierId) {
            ap.set('supplier_id', supplierId)
          }
          ap.set('description', 'Pedido de Compra ' + (po.get('order_number') || ''))
          ap.set('amount', totalReceivedAmount)
          if (dueDate) {
            ap.set('due_date', dueDate)
          } else {
            ap.set('due_date', new Date().toISOString().split('T')[0])
          }
          ap.set('status', 'Pendente')
          if (bankAccountId) {
            ap.set('bank_account_id', bankAccountId)
          }
          $app.save(ap)
        } catch (apErr) {
          $app.logger().error('accounts_payable creation failed', 'error', String(apErr))
        }
      }

      try {
        var auditCol = $app.findCollectionByNameOrId('audit_logs')
        var audit = new Record(auditCol)
        if (e.auth) {
          audit.set('user_id', e.auth.id)
        }
        audit.set('action', 'RECEIVE')
        audit.set('resource', 'purchase_orders')
        audit.set('resource_id', id)
        audit.set(
          'details',
          'Recebimento do pedido ' +
            (po.get('order_number') || '') +
            ' - Status: ' +
            (po.get('status') || ''),
        )
        $app.save(audit)
      } catch (auditErr) {
        $app.logger().error('audit log failed', 'error', String(auditErr))
      }

      return e.json(200, {
        success: true,
        status: po.get('status'),
        received_amount: totalReceivedAmount,
      })
    } catch (err) {
      $app.logger().error('purchase_orders_receive error', 'error', String(err))
      return e.json(500, { message: 'Erro interno ao processar recebimento: ' + String(err) })
    }
  },
  $apis.requireAuth(),
)
