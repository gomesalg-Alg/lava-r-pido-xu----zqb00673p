routerAdd(
  'GET',
  '/backend/v1/recibo/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    if (!id) return e.notFoundError('Recibo não encontrado')

    try {
      const receivable = $app.findRecordById('accounts_receivable', id)

      let company = null
      try {
        company = $app.findFirstRecordByFilter('company', "id != ''")
      } catch (_) {}

      let customer = null
      const customerId = receivable.getString('customer_id')
      if (customerId) {
        try {
          const c = $app.findRecordById('customers', customerId)
          customer = {
            name: c.getString('name'),
            phone: c.getString('phone'),
            cpf: c.getString('cpf'),
          }
        } catch (_) {}
      }

      let services = []
      let products = []
      let payments = []
      let changeAmount = 0
      let grandTotal = 0
      let totalPaid = 0
      let created = receivable.getString('created')
      let receiptType = 'os'

      const orderId = receivable.getString('order_id')
      const vendaAvulsaId = receivable.getString('venda_avulsa_id')

      if (vendaAvulsaId) {
        receiptType = 'venda_avulsa'
        try {
          const va = $app.findRecordById('vendas_avulsas', vendaAvulsaId)
          grandTotal = parseFloat(va.getString('total_amount')) || 0
          changeAmount = parseFloat(va.getString('change_amount')) || 0
          totalPaid = grandTotal + changeAmount
          created = va.getString('created')

          let rawItems = va.get('items')
          let itemsArr = []
          if (typeof rawItems === 'string') {
            try {
              itemsArr = JSON.parse(rawItems)
            } catch (_) {}
          } else if (Array.isArray(rawItems)) {
            itemsArr = rawItems
          }

          for (let i = 0; i < itemsArr.length; i++) {
            let itemName = 'Produto'
            try {
              const prod = $app.findRecordById('products', itemsArr[i].product_id)
              itemName = prod.getString('name')
            } catch (_) {}
            const qty = itemsArr[i].quantity || 1
            const unit = parseFloat(itemsArr[i].unit_price) || 0
            const total = parseFloat(itemsArr[i].total_price) || qty * unit
            products.push({ description: itemName, quantity: qty, unit_price: unit, total: total })
          }

          const pm = va.getString('payment_method')
          if (pm) {
            payments.push({ method: pm, amount: totalPaid, card_flag: '', installments: 1 })
          }
        } catch (_) {}
      } else if (orderId) {
        receiptType = 'os'
        try {
          const order = $app.findRecordById('service_orders', orderId)
          grandTotal = parseFloat(receivable.getString('amount')) || 0
          created = order.getString('created')

          let soItems = []
          try {
            soItems = $app.findRecordsByFilter(
              'service_order_items',
              'order_id = "' + orderId + '"',
              'created',
              0,
              0,
            )
          } catch (_) {}

          for (let j = 0; j < soItems.length; j++) {
            const svcId = soItems[j].getString('service_id')
            const prodId = soItems[j].getString('product_id')
            const soQty = parseFloat(soItems[j].getString('quantity')) || 1
            const soUnit = parseFloat(soItems[j].getString('unit_price')) || 0
            const soTotal = parseFloat(soItems[j].getString('total_price')) || soQty * soUnit

            if (svcId) {
              let svcName = 'Serviço'
              try {
                const svc = $app.findRecordById('services', svcId)
                svcName = svc.getString('name')
              } catch (_) {}
              services.push({
                description: svcName,
                quantity: soQty,
                unit_price: soUnit,
                total: soTotal,
              })
            } else if (prodId) {
              let prodName = 'Produto'
              try {
                const p = $app.findRecordById('products', prodId)
                prodName = p.getString('name')
              } catch (_) {}
              products.push({
                description: prodName,
                quantity: soQty,
                unit_price: soUnit,
                total: soTotal,
              })
            }
          }

          let pays = []
          try {
            pays = $app.findRecordsByFilter(
              'order_payments',
              'order_id = "' + orderId + '"',
              'created',
              0,
              0,
            )
          } catch (_) {}

          for (let k = 0; k < pays.length; k++) {
            const payAmount = parseFloat(pays[k].getString('amount')) || 0
            payments.push({
              method: pays[k].getString('method'),
              amount: payAmount,
              card_flag: pays[k].getString('card_flag'),
              installments: parseInt(pays[k].getString('installments')) || 1,
            })
            totalPaid += payAmount
          }

          if (totalPaid > grandTotal) {
            changeAmount = totalPaid - grandTotal
          }
        } catch (_) {}
      }

      return e.json(200, {
        company: company
          ? {
              name: company.getString('name'),
              trading_name: company.getString('trading_name'),
              cnpj: company.getString('cnpj'),
              phone: company.getString('phone'),
              address: company.getString('address'),
              number: company.getString('number'),
              city: company.getString('city'),
              state: company.getString('state'),
            }
          : null,
        customer: customer,
        type: receiptType,
        services: services,
        products: products,
        payments: payments,
        total_paid: totalPaid,
        change_amount: changeAmount,
        grand_total: grandTotal,
        description: receivable.getString('description'),
        created: created,
        status: receivable.getString('status'),
      })
    } catch (err) {
      return e.notFoundError('Recibo não encontrado')
    }
  },
  $apis.requireAuth(),
)
