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

  if (ar) {
    try {
      $app.expandRecord(ar, ['customer_id', 'order_id', 'venda_avulsa_id'])
    } catch (_) {}
    if (!order) {
      try {
        order = ar.expandedOne('order_id')
      } catch (_) {}
    }
    if (!venda) {
      try {
        venda = ar.expandedOne('venda_avulsa_id')
      } catch (_) {}
    }
  }
  if (order) {
    try {
      $app.expandRecord(order, ['customer_id', 'vehicle_id'])
    } catch (_) {}
  }

  try {
    var result = {
      id: ar ? ar.id : order ? order.id : venda ? venda.id : id,
      amount: ar ? ar.getDouble('amount') : venda ? venda.getDouble('total_amount') : 0,
      status: ar ? ar.getString('status') : order ? order.getString('status') : 'Recebido',
      description: ar ? ar.getString('description') : '',
      payment_method: ar
        ? ar.getString('payment_method')
        : venda
          ? venda.getString('payment_method')
          : '',
      received_at: ar ? ar.getString('received_at') : '',
      created: ar
        ? ar.getString('created')
        : order
          ? order.getString('created')
          : venda
            ? venda.getString('created')
            : '',
      customer: null,
      vehicle: null,
      order: null,
      venda_avulsa: null,
      payments: [],
      items: [],
      company: null,
      service_subtotal: 0,
      product_subtotal: 0,
    }

    var customer = null
    if (ar) {
      try {
        customer = ar.expandedOne('customer_id')
      } catch (_) {}
    }
    if (!customer && order) {
      try {
        customer = order.expandedOne('customer_id')
      } catch (_) {}
    }
    if (!customer && venda) {
      try {
        var vcId = venda.getString('customer_id')
        if (vcId) {
          $app.expandRecord(venda, ['customer_id'])
          customer = venda.expandedOne('customer_id')
        }
      } catch (_) {}
    }
    if (customer) {
      result.customer = {
        name: customer.getString('name'),
        phone: customer.getString('phone'),
        cpf: customer.getString('cpf'),
      }
    }

    if (order) {
      try {
        var vehicle = order.expandedOne('vehicle_id')
        if (vehicle) {
          result.vehicle = {
            brand: vehicle.getString('brand'),
            model: vehicle.getString('model'),
            year: vehicle.getInt('year'),
            placa: vehicle.getString('placa'),
            type: vehicle.getString('type'),
          }
        }
      } catch (_) {}

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
          try {
            $app.expandRecord(orderItems[i], ['service_id', 'product_id'])
          } catch (_) {}
          var svcRef = null,
            prodRef = null
          try {
            svcRef = orderItems[i].expandedOne('service_id')
          } catch (_) {}
          try {
            prodRef = orderItems[i].expandedOne('product_id')
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
