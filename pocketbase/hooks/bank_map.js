routerAdd(
  'GET',
  '/backend/v1/bank-map',
  (e) => {
    try {
      const query = e.requestInfo().query || {}
      let startMonth = query.startMonth || ''
      let endMonth = query.endMonth || ''

      if (!startMonth || !endMonth) {
        const now = new Date()
        const pad = (n) => String(n).padStart(2, '0')
        const startY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        const startM = now.getMonth() === 0 ? 12 : now.getMonth()
        startMonth = startY + '-' + pad(startM)
        endMonth = now.getFullYear() + '-' + pad(now.getMonth() + 1)
      }

      const months = []
      {
        const sp = startMonth.split('-')
        const ep = endMonth.split('-')
        let y = parseInt(sp[0], 10)
        let m = parseInt(sp[1], 10)
        const ey = parseInt(ep[0], 10)
        const em = parseInt(ep[1], 10)
        while (y < ey || (y === ey && m <= em)) {
          months.push(y + '-' + String(m).padStart(2, '0'))
          m++
          if (m > 12) {
            m = 1
            y++
          }
        }
      }

      const accountRecs = $app.findRecordsByFilter(
        'account_categories',
        "type = 'Receita' && nature = 'Analítica'",
        'code',
        0,
        0,
      )
      const accountMap = {}
      const accounts = []
      for (const a of accountRecs) {
        accountMap[a.id] = { values: {} }
        for (const mo of months) accountMap[a.id].values[mo] = 0
        accounts.push({ id: a.id, name: a.getString('name'), code: a.getString('code') || '' })
      }

      const serviceAccount = {}
      {
        const recs = $app.findRecordsByFilter('services', '', '', 0, 0)
        for (const r of recs) serviceAccount[r.id] = r.getString('account_category_id') || ''
      }
      const productAccount = {}
      {
        const recs = $app.findRecordsByFilter('products', '', '', 0, 0)
        for (const r of recs) productAccount[r.id] = r.getString('account_category_id') || ''
      }

      const orderMonth = {}
      {
        const recs = $app.findRecordsByFilter('service_orders', "status != 'Cancelado'", '', 0, 0)
        for (const r of recs) {
          const d = r.getString('emission_date') || ''
          orderMonth[r.id] = d.length >= 7 ? d.substring(0, 7) : ''
        }
      }

      {
        const recs = $app.findRecordsByFilter('service_order_items', '', '', 0, 0)
        for (const item of recs) {
          const orderId = item.getString('order_id')
          const month = orderMonth[orderId] || ''
          if (!month) continue
          const svcId = item.getString('service_id')
          const prodId = item.getString('product_id')
          const accId = (svcId && serviceAccount[svcId]) || (prodId && productAccount[prodId]) || ''
          if (!accId || !accountMap[accId]) continue
          if (accountMap[accId].values[month] === undefined) continue
          accountMap[accId].values[month] += item.getFloat('total_price') || 0
        }
      }

      {
        const recs = $app.findRecordsByFilter('vendas_avulsas', '', '', 0, 0)
        for (const va of recs) {
          const d = va.getString('created') || ''
          const month = d.length >= 7 ? d.substring(0, 7) : ''
          if (!month) continue
          let items = []
          try {
            const raw = va.get('items')
            if (Array.isArray(raw)) items = raw
            else if (typeof raw === 'string') items = JSON.parse(raw || '[]')
          } catch (_) {
            try {
              items = JSON.parse(va.getString('items') || '[]')
            } catch (__) {
              items = []
            }
          }
          if (!Array.isArray(items)) continue
          for (const it of items) {
            const pid = it.product_id || ''
            const sid = it.service_id || ''
            const iid = it.id || ''
            const accId =
              (pid && productAccount[pid]) ||
              (sid && serviceAccount[sid]) ||
              (iid && (productAccount[iid] || serviceAccount[iid])) ||
              ''
            if (!accId || !accountMap[accId]) continue
            if (accountMap[accId].values[month] === undefined) continue
            const price = Number(
              it.total_price || Number(it.unit_price || 0) * Number(it.quantity || 1),
            )
            accountMap[accId].values[month] += price
          }
        }
      }

      const receivedByMonth = {}
      for (const mo of months) receivedByMonth[mo] = 0
      {
        const recs = $app.findRecordsByFilter(
          'accounts_receivable',
          "status = 'Recebido'",
          '',
          0,
          0,
        )
        for (const ar of recs) {
          const d = ar.getString('received_at') || ''
          const month = d.length >= 7 ? d.substring(0, 7) : ''
          if (!month || receivedByMonth[month] === undefined) continue
          const amt =
            (ar.getFloat('amount') || 0) -
            (ar.getFloat('discount_amount') || 0) +
            (ar.getFloat('surcharge_amount') || 0)
          receivedByMonth[month] += amt
        }
      }

      const rows = []
      const columnTotals = {}
      for (const mo of months) columnTotals[mo] = 0
      let grandTotal = 0
      for (const acc of accounts) {
        const vals = accountMap[acc.id].values
        let rowTotal = 0
        for (const mo of months) {
          rowTotal += vals[mo] || 0
          columnTotals[mo] += vals[mo] || 0
        }
        grandTotal += rowTotal
        rows.push({
          accountId: acc.id,
          accountName: acc.name,
          accountCode: acc.code,
          values: vals,
          total: rowTotal,
        })
      }
      let receivedTotal = 0
      for (const mo of months) receivedTotal += receivedByMonth[mo]

      return e.json(200, {
        months,
        rows,
        columnTotals,
        grandTotal,
        received: receivedByMonth,
        receivedTotal,
      })
    } catch (err) {
      $app.logger().error('bank-map aggregation failed', 'error', String(err))
      return e.json(500, { error: String((err && err.message) || err) })
    }
  },
  $apis.requireAuth(),
)
