routerAdd(
  'GET',
  '/backend/v1/bank-map',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'Administrador') {
      return e.forbiddenError('Acesso restrito a administradores')
    }

    const query = e.requestInfo().query || {}
    let startMonth = query.start || ''
    let endMonth = query.end || ''

    if (!startMonth || !endMonth) {
      const now = new Date()
      const year = now.getUTCFullYear()
      startMonth = year + '-01'
      endMonth = year + '-12'
    }

    const months = []
    const sy = parseInt(startMonth.substring(0, 4), 10)
    const sm = parseInt(startMonth.substring(5, 7), 10)
    const ey = parseInt(endMonth.substring(0, 4), 10)
    const em = parseInt(endMonth.substring(5, 7), 10)
    let y = sy
    let m = sm
    while (y < ey || (y === ey && m <= em)) {
      months.push(y + '-' + (m < 10 ? '0' + m : '' + m))
      m++
      if (m > 12) {
        m = 1
        y++
      }
    }

    const accounts = $app.findRecordsByFilter(
      'account_categories',
      "type = 'Receita' && nature = 'Analítica'",
      'code',
      0,
      0,
    )

    const serviceAccountMap = {}
    const services = $app.findRecordsByFilter('services', "id != ''", 'created', 0, 0)
    for (let i = 0; i < services.length; i++) {
      serviceAccountMap[services[i].id] = services[i].getString('account_category_id')
    }

    const productAccountMap = {}
    const products = $app.findRecordsByFilter('products', "id != ''", 'created', 0, 0)
    for (let i = 0; i < products.length; i++) {
      productAccountMap[products[i].id] = products[i].getString('account_category_id')
    }

    const orderDateMap = {}
    const orders = $app.findRecordsByFilter('service_orders', "id != ''", 'created', 0, 0)
    for (let i = 0; i < orders.length; i++) {
      orderDateMap[orders[i].id] = orders[i].getString('emission_date')
    }

    const revenueMap = {}

    const soItems = $app.findRecordsByFilter('service_order_items', "id != ''", 'created', 0, 0)
    for (let i = 0; i < soItems.length; i++) {
      const item = soItems[i]
      const orderId = item.getString('order_id')
      const emissionDate = orderDateMap[orderId]
      if (!emissionDate) continue

      const month = emissionDate.substring(0, 7)
      if (month < startMonth || month > endMonth) continue

      const serviceId = item.getString('service_id')
      const productId = item.getString('product_id')
      let accountId = ''
      if (serviceId && serviceAccountMap[serviceId]) {
        accountId = serviceAccountMap[serviceId]
      } else if (productId && productAccountMap[productId]) {
        accountId = productAccountMap[productId]
      }
      if (!accountId) continue

      const totalPrice = item.getDouble('total_price')
      if (!revenueMap[accountId]) revenueMap[accountId] = {}
      if (!revenueMap[accountId][month]) revenueMap[accountId][month] = 0
      revenueMap[accountId][month] += totalPrice
    }

    const vendas = $app.findRecordsByFilter('vendas_avulsas', "id != ''", 'created', 0, 0)
    for (let i = 0; i < vendas.length; i++) {
      const venda = vendas[i]
      const created = venda.getString('created')
      if (!created) continue
      const vMonth = created.substring(0, 7)
      if (vMonth < startMonth || vMonth > endMonth) continue

      const rawItems = venda.get('items')
      let itemsArr = []
      if (Array.isArray(rawItems)) {
        itemsArr = rawItems
      } else if (typeof rawItems === 'string') {
        try {
          itemsArr = JSON.parse(rawItems)
        } catch (_) {}
      }

      for (let j = 0; j < itemsArr.length; j++) {
        const vItem = itemsArr[j]
        let vAccountId = ''
        if (vItem.service_id && serviceAccountMap[vItem.service_id]) {
          vAccountId = serviceAccountMap[vItem.service_id]
        } else if (vItem.product_id && productAccountMap[vItem.product_id]) {
          vAccountId = productAccountMap[vItem.product_id]
        }
        if (!vAccountId) continue

        const vTotal = Number(vItem.total_price) || 0
        if (!revenueMap[vAccountId]) revenueMap[vAccountId] = {}
        if (!revenueMap[vAccountId][vMonth]) revenueMap[vAccountId][vMonth] = 0
        revenueMap[vAccountId][vMonth] += vTotal
      }
    }

    const receivedMap = {}
    const receivedRecords = $app.findRecordsByFilter(
      'accounts_receivable',
      "status = 'Recebido'",
      'created',
      0,
      0,
    )
    for (let i = 0; i < receivedRecords.length; i++) {
      const rec = receivedRecords[i]
      const receivedAt = rec.getString('received_at')
      if (!receivedAt) continue
      const rMonth = receivedAt.substring(0, 7)
      if (rMonth < startMonth || rMonth > endMonth) continue
      const rAmount = rec.getDouble('amount')
      if (!receivedMap[rMonth]) receivedMap[rMonth] = 0
      receivedMap[rMonth] += rAmount
    }

    const accountsList = []
    for (let i = 0; i < accounts.length; i++) {
      accountsList.push({
        id: accounts[i].id,
        name: accounts[i].getString('name'),
        code: accounts[i].getString('code'),
      })
    }

    return e.json(200, {
      accounts: accountsList,
      months: months,
      revenue: revenueMap,
      received: receivedMap,
    })
  },
  $apis.requireAuth(),
)
