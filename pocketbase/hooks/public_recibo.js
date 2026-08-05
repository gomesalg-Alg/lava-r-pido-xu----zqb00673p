routerAdd('GET', '/backend/v1/public/recibo/{id}', (e) => {
  const id = e.request.pathValue('id')
  if (!id) return e.badRequestError('id is required')

  try {
    let ar = null
    let order = null
    let venda = null

    try {
      ar = $app.findRecordById('accounts_receivable', id)
    } catch (_) {
      ar = null
    }

    if (ar) {
      try {
        $app.expandRecord(ar, ['customer_id', 'order_id', 'venda_avulsa_id'])
      } catch (_) {}
      order = ar.expandedOne('order_id')
      if (order) {
        try {
          $app.expandRecord(order, ['customer_id', 'vehicle_id'])
        } catch (_) {}
      }
      venda = ar.expandedOne('venda_avulsa_id')
    }

    if (!ar) {
      try {
        order = $app.findRecordById('service_orders', id)
      } catch (_) {
        order = null
      }

      if (order) {
        try {
          $app.expandRecord(order, ['customer_id', 'vehicle_id'])
        } catch (_) {}

        try {
          ar = $app.findFirstRecordByFilter(
            'accounts_receivable',
            'order_id = {:oid}',
            undefined,
            0,
            0,
            { oid: id },
          )
          try {
            $app.expandRecord(ar, ['customer_id', 'order_id', 'venda_avulsa_id'])
          } catch (_) {}
          venda = ar.expandedOne('venda_avulsa_id')
        } catch (_) {
          ar = null
        }
      } else {
        try {
          venda = $app.findRecordById('vendas_avulsas', id)
        } catch (_) {
          venda = null
        }

        if (venda) {
          try {
            ar = $app.findFirstRecordByFilter(
              'accounts_receivable',
              'venda_avulsa_id = {:vid}',
              undefined,
              0,
              0,
              { vid: id },
            )
            try {
              $app.expandRecord(ar, ['customer_id', 'order_id', 'venda_avulsa_id'])
            } catch (_) {}
            order = ar.expandedOne('order_id')
            if (order) {
              try {
                $app.expandRecord(order, ['customer_id', 'vehicle_id'])
              } catch (_) {}
            }
          } catch (_) {
            ar = null
          }
        }
      }
    }

    if (!ar && !order && !venda) {
      return e.notFoundError('Recibo não encontrado')
    }

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
    if (ar && ar.expandedOne('customer_id')) {
      customer = ar.expandedOne('customer_id')
    } else if (order && order.expandedOne('customer_id')) {
      customer = order.expandedOne('customer_id')
    } else if (venda) {
      try {
        var vendaCustomerId = venda.getString('customer_id')
        if (vendaCustomerId) {
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
      result.order = {
        ticket_number: order.getInt('ticket_number'),
        total_discount: order.getDouble('total_discount'),
        total_surcharge: order.getDouble('total_surcharge'),
        amount_paid: order.getDouble('amount_paid'),
      }

      var orderItems = $app.findRecordsByFilter(
        'service_order_items',
        'order_id = {:oid}',
        'created',
        0,
        0,
        { oid: order.id },
      )
      for (var i = 0; i < orderItems.length; i++) {
        try {
          $app.expandRecord(orderItems[i], ['service_id', 'product_id'])
        } catch (_) {}
        var serviceRef = orderItems[i].expandedOne('service_id')
        var productRef = orderItems[i].expandedOne('product_id')
        var itemTotal = orderItems[i].getDouble('total_price')
        if (serviceRef) result.service_subtotal += itemTotal
        if (productRef) result.product_subtotal += itemTotal
        result.items.push({
          name: serviceRef
            ? serviceRef.getString('name')
            : productRef
              ? productRef.getString('name')
              : '',
          type: serviceRef ? 'service' : 'product',
          quantity: orderItems[i].getInt('quantity'),
          unit_price: orderItems[i].getDouble('unit_price'),
          total_price: itemTotal,
          discount_amount: orderItems[i].getDouble('discount_amount'),
          surcharge_amount: orderItems[i].getDouble('surcharge_amount'),
        })
      }

      var rawPayments = $app.findRecordsByFilter(
        'order_payments',
        'order_id = {:oid}',
        'created',
        0,
        0,
        { oid: order.id },
      )
      for (var j = 0; j < rawPayments.length; j++) {
        result.payments.push({
          method: rawPayments[j].getString('method'),
          amount: rawPayments[j].getDouble('amount'),
          card_flag: rawPayments[j].getString('card_flag'),
          installments: rawPayments[j].getInt('installments'),
        })
      }
    }

    if (!venda && ar && ar.expandedOne('venda_avulsa_id')) {
      venda = ar.expandedOne('venda_avulsa_id')
    }

    if (venda) {
      result.venda_avulsa = {
        items: venda.get('items'),
        total_amount: venda.getDouble('total_amount'),
        payment_method: venda.getString('payment_method'),
        change_amount: venda.getDouble('change_amount'),
      }
      if (!order && result.payments.length === 0) {
        var vendaPayments = $app.findRecordsByFilter(
          'order_payments',
          'venda_avulsa_id = {:vid}',
          'created',
          0,
          0,
          { vid: venda.id },
        )
        for (var k = 0; k < vendaPayments.length; k++) {
          result.payments.push({
            method: vendaPayments[k].getString('method'),
            amount: vendaPayments[k].getDouble('amount'),
            card_flag: vendaPayments[k].getString('card_flag'),
            installments: vendaPayments[k].getInt('installments'),
          })
        }
      }
      if (!order && (!ar || result.amount === 0)) {
        var calcTotal = venda.getDouble('total_amount')
        result.amount = calcTotal
      }
    }

    if (!ar && order && result.items.length > 0) {
      var calcTotal2 = 0
      for (var m = 0; m < result.items.length; m++) {
        calcTotal2 += result.items[m].total_price || 0
      }
      result.amount = calcTotal2
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
    return e.notFoundError('Recibo não encontrado')
  }
})
