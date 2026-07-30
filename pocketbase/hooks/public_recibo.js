routerAdd('GET', '/backend/v1/public/recibo/{id}', (e) => {
  const id = e.request.pathValue('id')
  if (!id) return e.badRequestError('id is required')

  try {
    const ar = $app.findRecordById('accounts_receivable', id)
    $app.expandRecord(ar, ['customer_id', 'order_id', 'venda_avulsa_id'])

    const result = {
      id: ar.id,
      amount: ar.getDouble('amount'),
      status: ar.getString('status'),
      description: ar.getString('description'),
      payment_method: ar.getString('payment_method'),
      received_at: ar.getString('received_at'),
      created: ar.getString('created'),
      customer: null,
      order: null,
      venda_avulsa: null,
      payments: [],
      items: [],
      company: null,
      service_subtotal: 0,
      product_subtotal: 0,
    }

    const customer = ar.expandedOne('customer_id')
    if (customer) {
      result.customer = {
        name: customer.getString('name'),
        phone: customer.getString('phone'),
        cpf: customer.getString('cpf'),
      }
    }

    const order = ar.expandedOne('order_id')
    if (order) {
      result.order = {
        ticket_number: order.getInt('ticket_number'),
        total_discount: order.getDouble('total_discount'),
        total_surcharge: order.getDouble('total_surcharge'),
        amount_paid: order.getDouble('amount_paid'),
      }

      const orderItems = $app.findRecordsByFilter(
        'service_order_items',
        'order_id = "' + order.id + '"',
        'created',
        0,
        0,
      )
      for (const item of orderItems) {
        $app.expandRecord(item, ['service_id', 'product_id'])
        const serviceRef = item.expandedOne('service_id')
        const productRef = item.expandedOne('product_id')
        const itemTotal = item.getDouble('total_price')
        if (serviceRef) {
          result.service_subtotal += itemTotal
        }
        if (productRef) {
          result.product_subtotal += itemTotal
        }
        result.items.push({
          name: serviceRef
            ? serviceRef.getString('name')
            : productRef
              ? productRef.getString('name')
              : '',
          type: serviceRef ? 'service' : 'product',
          quantity: item.getInt('quantity'),
          unit_price: item.getDouble('unit_price'),
          total_price: itemTotal,
          discount_amount: item.getDouble('discount_amount'),
          surcharge_amount: item.getDouble('surcharge_amount'),
        })
      }
    }

    const venda = ar.expandedOne('venda_avulsa_id')
    if (venda) {
      result.venda_avulsa = {
        items: venda.get('items'),
        total_amount: venda.getDouble('total_amount'),
        payment_method: venda.getString('payment_method'),
        change_amount: venda.getDouble('change_amount'),
      }
    }

    let rawPayments = []
    if (order) {
      rawPayments = $app.findRecordsByFilter(
        'order_payments',
        'order_id = "' + order.id + '"',
        'created',
        0,
        0,
      )
    } else if (venda) {
      rawPayments = $app.findRecordsByFilter(
        'order_payments',
        'venda_avulsa_id = "' + venda.id + '"',
        'created',
        0,
        0,
      )
    }

    const orderTotal = ar.getDouble('amount') || 0
    const fallbackMethod =
      ar.getString('payment_method') || (venda ? venda.getString('payment_method') : '')
    const changeAmount = venda ? venda.getDouble('change_amount') : 0

    const parsedPayments = []
    for (let i = 0; i < rawPayments.length; i++) {
      const p = rawPayments[i]
      parsedPayments.push({
        method: p.getString('method'),
        amount: p.getDouble('amount'),
        card_flag: p.getString('card_flag'),
        installments: p.getInt('installments'),
      })
    }

    let finalPayments = []
    let rawSum = 0
    for (let i = 0; i < parsedPayments.length; i++) {
      rawSum += parsedPayments[i].amount
    }

    if (parsedPayments.length > 0) {
      if (rawSum > orderTotal + 0.01) {
        const uniqueMap = {}
        const dedupedList = []
        for (let i = 0; i < parsedPayments.length; i++) {
          const item = parsedPayments[i]
          const sig =
            item.method +
            '_' +
            item.amount.toFixed(2) +
            '_' +
            (item.card_flag || '') +
            '_' +
            (item.installments || 1)
          if (!uniqueMap[sig]) {
            uniqueMap[sig] = true
            dedupedList.push(item)
          }
        }
        let dedupedSum = 0
        for (let i = 0; i < dedupedList.length; i++) {
          dedupedSum += dedupedList[i].amount
        }
        if (
          Math.abs(dedupedSum - orderTotal) < 0.01 ||
          Math.abs(dedupedSum - (orderTotal + changeAmount)) < 0.01 ||
          (dedupedSum >= orderTotal && rawSum > dedupedSum)
        ) {
          finalPayments = dedupedList
        } else {
          finalPayments = parsedPayments
        }
      } else {
        finalPayments = parsedPayments
      }
    }

    if (finalPayments.length === 0 && fallbackMethod) {
      finalPayments.push({
        method: fallbackMethod,
        amount: orderTotal,
        card_flag: '',
        installments: 1,
      })
    }

    result.payments = finalPayments

    var paymentSum = 0
    for (var i = 0; i < finalPayments.length; i++) {
      paymentSum += finalPayments[i].amount
    }
    var computedTroco =
      changeAmount > 0 ? changeAmount : paymentSum > orderTotal ? paymentSum - orderTotal : 0
    result.troco = computedTroco
    result.total_paid = computedTroco > 0 ? paymentSum - computedTroco : paymentSum

    let company = null
    try {
      company = $app.findFirstRecordByFilter('company', "id != ''")
    } catch (_) {}

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

    return e.json(200, result)
  } catch (err) {
    return e.notFoundError('Registro não encontrado')
  }
})
