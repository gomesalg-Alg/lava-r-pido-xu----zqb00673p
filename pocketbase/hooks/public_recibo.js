routerAdd('GET', '/backend/v1/public/recibo/{id}', (e) => {
  const id = e.request.pathValue('id')
  if (!id) return e.badRequestError('id is required')

  var ar = null
  var order = null
  var venda = null

  try {
    ar = $app.findRecordById('accounts_receivable', id)
  } catch (_) {
    ar = null
  }

  if (!ar) {
    try {
      order = $app.findRecordById('service_orders', id)
    } catch (_) {
      order = null
    }

    if (order) {
      try {
        var arList = $app.findRecordsByFilter(
          'accounts_receivable',
          'order_id = "' + id + '"',
          '-created',
          1,
          0,
        )
        if (arList.length > 0) ar = arList[0]
      } catch (_) {}
    } else {
      try {
        venda = $app.findRecordById('vendas_avulsas', id)
      } catch (_) {
        venda = null
      }

      if (venda) {
        try {
          var arList2 = $app.findRecordsByFilter(
            'accounts_receivable',
            'venda_avulsa_id = "' + id + '"',
            '-created',
            1,
            0,
          )
          if (arList2.length > 0) ar = arList2[0]
        } catch (_) {}
      }
    }
  }

  if (!ar && !order && !venda) {
    return e.json(404, { error: 'Recibo não encontrado', code: 'NOT_FOUND' })
  }

  var result = {
    id: ar ? ar.id : order ? order.id : venda ? venda.id : id,
    amount: 0,
    status: '',
    description: '',
    payment_method: '',
    received_at: '',
    created: '',
    customer: null,
    vehicle: null,
    order: null,
    venda_avulsa: null,
    payments: [],
    items: [],
    company: null,
    service_subtotal: 0,
    product_subtotal: 0,
    troco: 0,
    total_paid: 0,
  }

  try {
    if (ar) {
      result.amount = ar.getDouble('amount')
      result.status = ar.getString('status')
      result.description = ar.getString('description')
      result.payment_method = ar.getString('payment_method')
      result.received_at = ar.getString('received_at')
      result.created = ar.getString('created')
    } else if (order) {
      result.status = order.getString('status')
      result.created = order.getString('created')
    } else if (venda) {
      result.status = 'Recebido'
      result.created = venda.getString('created')
      result.amount = venda.getDouble('total_amount')
      result.payment_method = venda.getString('payment_method')
    }

    var customer = null
    var vehicle = null

    if (ar && !order) {
      try {
        var orderId = ar.getString('order_id')
        if (orderId) order = $app.findRecordById('service_orders', orderId)
      } catch (_) {}
    }

    if (ar && !venda) {
      try {
        var vendaId = ar.getString('venda_avulsa_id')
        if (vendaId) venda = $app.findRecordById('vendas_avulsas', vendaId)
      } catch (_) {}
    }

    if (ar) {
      try {
        var custId = ar.getString('customer_id')
        if (custId) customer = $app.findRecordById('customers', custId)
      } catch (_) {}
    }

    if (!customer && order) {
      try {
        var ordCustId = order.getString('customer_id')
        if (ordCustId) customer = $app.findRecordById('customers', ordCustId)
      } catch (_) {}
    }

    if (!customer && venda) {
      try {
        var vendCustId = venda.getString('customer_id')
        if (vendCustId) customer = $app.findRecordById('customers', vendCustId)
      } catch (_) {}
    }

    if (order) {
      try {
        var vehId = order.getString('vehicle_id')
        if (vehId) vehicle = $app.findRecordById('vehicles', vehId)
      } catch (_) {}
    }

    if (customer) {
      result.customer = {
        name: customer.getString('name'),
        phone: customer.getString('phone'),
        cpf: customer.getString('cpf'),
      }
    }

    if (vehicle) {
      result.vehicle = {
        brand: vehicle.getString('brand'),
        model: vehicle.getString('model'),
        year: vehicle.getInt('year'),
        placa: vehicle.getString('placa'),
        type: vehicle.getString('type'),
      }
    }

    if (order) {
      result.order = {
        ticket_number: order.getInt('ticket_number'),
        total_discount: order.getDouble('total_discount'),
        total_surcharge: order.getDouble('total_surcharge'),
        amount_paid: order.getDouble('amount_paid'),
      }

      try {
        var orderItems = $app.findRecordsByFilter(
          'service_order_items',
          'order_id = "' + order.id + '"',
          'created',
          0,
          0,
        )
        for (var i = 0; i < orderItems.length; i++) {
          var svcRef = null
          var prodRef = null
          try {
            var svcId = orderItems[i].getString('service_id')
            if (svcId) svcRef = $app.findRecordById('services', svcId)
          } catch (_) {}
          try {
            var prodId = orderItems[i].getString('product_id')
            if (prodId) prodRef = $app.findRecordById('products', prodId)
          } catch (_) {}
          var iTotal = orderItems[i].getDouble('total_price')
          if (svcRef) result.service_subtotal += iTotal
          if (prodRef) result.product_subtotal += iTotal
          result.items.push({
            name: svcRef ? svcRef.getString('name') : prodRef ? prodRef.getString('name') : '',
            type: svcRef ? 'service' : 'product',
            quantity: orderItems[i].getInt('quantity'),
            unit_price: orderItems[i].getDouble('unit_price'),
            total_price: iTotal,
            discount_amount: orderItems[i].getDouble('discount_amount'),
            surcharge_amount: orderItems[i].getDouble('surcharge_amount'),
          })
        }
      } catch (_) {}

      try {
        var ordPays = $app.findRecordsByFilter(
          'order_payments',
          'order_id = "' + order.id + '"',
          'created',
          0,
          0,
        )
        for (var j = 0; j < ordPays.length; j++) {
          result.payments.push({
            method: ordPays[j].getString('method'),
            amount: ordPays[j].getDouble('amount'),
            card_flag: ordPays[j].getString('card_flag'),
            installments: ordPays[j].getInt('installments'),
          })
        }
      } catch (_) {}
    }

    if (venda) {
      var rawItems = venda.get('items')
      if (rawItems == null) {
        rawItems = []
      } else if (typeof rawItems === 'string') {
        try {
          rawItems = JSON.parse(rawItems)
        } catch (_) {
          rawItems = []
        }
      }
      if (!Array.isArray(rawItems)) rawItems = []

      result.venda_avulsa = {
        items: rawItems,
        total_amount: venda.getDouble('total_amount'),
        payment_method: venda.getString('payment_method'),
        change_amount: venda.getDouble('change_amount'),
      }

      if (!order && result.payments.length === 0) {
        try {
          var vendPays = $app.findRecordsByFilter(
            'order_payments',
            'venda_avulsa_id = "' + venda.id + '"',
            'created',
            0,
            0,
          )
          for (var k = 0; k < vendPays.length; k++) {
            result.payments.push({
              method: vendPays[k].getString('method'),
              amount: vendPays[k].getDouble('amount'),
              card_flag: vendPays[k].getString('card_flag'),
              installments: vendPays[k].getInt('installments'),
            })
          }
        } catch (_) {}
      }

      if (!ar) {
        result.amount = venda.getDouble('total_amount')
      }
    }

    if (!ar && !venda && order && result.items.length > 0) {
      var calcTotal = 0
      for (var m = 0; m < result.items.length; m++) {
        calcTotal += result.items[m].total_price || 0
      }
      result.amount = calcTotal
    }

    var paymentSum = 0
    for (var p = 0; p < result.payments.length; p++) {
      paymentSum += result.payments[p].amount || 0
    }
    var changeAmount = venda ? venda.getDouble('change_amount') : 0
    result.troco =
      changeAmount > 0 ? changeAmount : paymentSum > result.amount ? paymentSum - result.amount : 0
    result.total_paid = result.troco > 0 ? paymentSum - result.troco : paymentSum

    try {
      var company = $app.findFirstRecordByFilter('company', "id != ''")
      if (company) {
        result.company = {
          id: company.id,
          name: company.getString('name'),
          trading_name: company.getString('trading_name'),
          phone: company.getString('phone'),
          address: company.getString('address'),
          number: company.getString('number'),
          city: company.getString('city'),
          state: company.getString('state'),
          logo: company.getString('logo'),
        }
      }
    } catch (_) {}

    return e.json(200, result)
  } catch (err) {
    $app.logger().error('public_recibo build error', 'id', id, 'error', String(err))
    return e.json(500, { error: 'Erro ao processar recibo', code: 'INTERNAL_ERROR' })
  }
})
