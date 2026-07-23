routerAdd(
  'GET',
  '/backend/v1/recibo/{id}',
  (e) => {
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

        const orderPayments = $app.findRecordsByFilter(
          'order_payments',
          'order_id = "' + order.id + '"',
          'created',
          0,
          0,
        )
        for (const p of orderPayments) {
          result.payments.push({
            method: p.getString('method'),
            amount: p.getDouble('amount'),
            card_flag: p.getString('card_flag'),
            installments: p.getInt('installments'),
          })
        }

        const orderItems = $app.findRecordsByFilter(
          'service_order_items',
          'order_id = "' + order.id + '"',
          'created',
          0,
          0,
          'service_id',
          'product_id',
        )
        for (const item of orderItems) {
          const serviceRef = item.expandedOne('service_id')
          const productRef = item.expandedOne('product_id')
          result.items.push({
            name: serviceRef
              ? serviceRef.getString('name')
              : productRef
                ? productRef.getString('name')
                : '',
            quantity: item.getInt('quantity'),
            unit_price: item.getDouble('unit_price'),
            total_price: item.getDouble('total_price'),
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

      return e.json(200, result)
    } catch (err) {
      return e.notFoundError('Registro não encontrado')
    }
  },
  $apis.requireAuth(),
)
