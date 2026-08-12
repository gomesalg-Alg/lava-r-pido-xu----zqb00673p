routerAdd(
  'POST',
  '/backend/v1/purchase-orders/{id}/receive',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body || {}
    const items = body.items || []
    var paymentMethodCode = body.payment_method_code || ''

    if (!items || !items.length) {
      return e.badRequestError('Nenhum item informado')
    }

    let po
    try {
      po = $app.findRecordById('purchase_orders', id)
    } catch (_) {
      return e.notFoundError('Pedido de compra não encontrado')
    }

    if (po.getString('status') === 'Cancelado') {
      return e.badRequestError('Pedido cancelado não pode receber itens')
    }

    var parseNum = function (v) {
      if (typeof v === 'number') return v
      if (typeof v !== 'string') return NaN
      var cleaned = v.replace(/\s/g, '').replace(',', '.')
      return parseFloat(cleaned)
    }

    var supplierId = po.getString('supplier_id')
    var totalAmount = 0
    var updatedItems = []
    var receivedItemsData = []

    for (var i = 0; i < items.length; i++) {
      var item = items[i]
      var receiveQty = parseNum(item.received_quantity)

      if (!Number.isFinite(receiveQty) || receiveQty <= 0) {
        return e.badRequestError('Quantidade recebida deve ser maior que zero')
      }

      var record
      try {
        record = $app.findRecordById('purchase_order_items', item.id)
      } catch (_) {
        return e.notFoundError('Item não encontrado: ' + item.id)
      }

      if (record.getString('purchase_order_id') !== id) {
        return e.badRequestError('Item não pertence a este pedido')
      }

      var orderedQty = record.getFloat('quantity') || 0
      var currentReceived = record.getFloat('received_quantity') || 0
      var remaining = orderedQty - currentReceived

      if (remaining <= 0) {
        return e.badRequestError('Item já totalmente recebido: ' + item.id)
      }

      if (receiveQty > remaining + 0.000001) {
        return e.badRequestError(
          'Quantidade informada (' +
            receiveQty +
            ') excede a quantidade restante (' +
            remaining +
            ') para o item',
        )
      }

      var newTotal = currentReceived + receiveQty
      record.set('received_quantity', newTotal)
      $app.save(record)

      var productId = record.getString('product_id')
      if (productId) {
        try {
          var product = $app.findRecordById('products', productId)
          var currentStock = product.getFloat('stock_quantity') || 0
          product.set('stock_quantity', currentStock + receiveQty)
          $app.save(product)
        } catch (_) {}
      }

      var unitPrice = record.getFloat('unit_price') || 0
      totalAmount += receiveQty * unitPrice
      updatedItems.push({ id: item.id, received_quantity: newTotal })
      receivedItemsData.push({
        item_id: item.id,
        received_quantity: receiveQty,
        unit_price: unitPrice,
      })
    }

    var apCol = $app.findCollectionByNameOrId('accounts_payable')
    var ap = new Record(apCol)
    ap.set('supplier_id', supplierId || null)
    ap.set('description', 'Recebimento - Pedido ' + po.getString('order_number'))
    ap.set('amount', totalAmount)

    var emissionDate = po.getString('emission_date')
    var expectedDate = po.getString('expected_date')
    ap.set('emission_date', emissionDate || null)
    ap.set('due_date', expectedDate || null)
    ap.set('status', 'Pendente')
    ap.set('purchase_order_id', id)
    ap.set('received_items', JSON.stringify(receivedItemsData))
    if (paymentMethodCode) {
      ap.set('payment_method_code', paymentMethodCode)
    }
    $app.save(ap)

    var allItems = $app.findRecordsByFilter(
      'purchase_order_items',
      "purchase_order_id = '" + id + "'",
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
    }

    po.set('status', newStatus)
    po.set('total_amount', computedTotal)
    $app.save(po)

    return e.json(200, {
      status: newStatus,
      items: updatedItems,
      accounts_payable_id: ap.id,
      amount: totalAmount,
    })
  },
  $apis.requireAuth(),
)
