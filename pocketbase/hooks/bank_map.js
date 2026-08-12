routerAdd(
  'GET',
  '/backend/v1/bank-map',
  (e) => {
    try {
      const query = e.requestInfo().query || {}
      let month = query.month || ''
      const bankAccountId = query.bankAccountId || ''
      const statusFilter = query.status || 'all'

      if (!month) {
        const now = new Date()
        const pad = function (n) {
          return String(n).padStart(2, '0')
        }
        month = now.getFullYear() + '-' + pad(now.getMonth() + 1)
      }

      var bankAccountRecs = $app.findRecordsByFilter('bank_accounts', '', 'name', 0, 0)
      var bankAccounts = []
      var bankAccountMap = {}
      for (var i = 0; i < bankAccountRecs.length; i++) {
        var ba = bankAccountRecs[i]
        var baId = ba.id
        var baName = ba.getString('name')
        var baTrading = ba.getString('trading_name') || baName
        bankAccounts.push({ id: baId, name: baName, tradingName: baTrading })
        bankAccountMap[baId] = { name: baName, tradingName: baTrading }
      }

      var customerMap = {}
      {
        var recs = $app.findRecordsByFilter('customers', '', '', 0, 0)
        for (var j = 0; j < recs.length; j++) {
          customerMap[recs[j].id] = recs[j].getString('name') || ''
        }
      }
      var supplierMap = {}
      {
        var sRecs = $app.findRecordsByFilter('suppliers', '', '', 0, 0)
        for (var k = 0; k < sRecs.length; k++) {
          supplierMap[sRecs[k].id] = sRecs[k].getString('name') || ''
        }
      }

      function statusMatches(recordStatus, isReceita) {
        if (statusFilter === 'all') return true
        if (statusFilter === 'settled') {
          return isReceita ? recordStatus === 'Recebido' : recordStatus === 'Pago'
        }
        return recordStatus === statusFilter
      }

      function matchesMonth(dateStr) {
        if (!dateStr) return false
        return dateStr.substring(0, 7) === month
      }

      function getRelevantDate(status, settledDate, dueDate) {
        if ((status === 'Recebido' || status === 'Pago') && settledDate) return settledDate
        return dueDate || ''
      }

      function getEffectiveAmount(record) {
        return (
          (record.getFloat('amount') || 0) -
          (record.getFloat('discount_amount') || 0) +
          (record.getFloat('surcharge_amount') || 0)
        )
      }

      function getBankAccountName(baId) {
        var info = bankAccountMap[baId]
        if (!info) return '—'
        return info.tradingName || info.name || '—'
      }

      var receitas = []
      {
        var arRecs = $app.findRecordsByFilter('accounts_receivable', '', '-created', 0, 0)
        for (var x = 0; x < arRecs.length; x++) {
          var ar = arRecs[x]
          var arStatus = ar.getString('status') || ''
          if (!statusMatches(arStatus, true)) continue
          var arBaId = ar.getString('bank_account_id') || ''
          if (bankAccountId && arBaId !== bankAccountId) continue
          var arReceivedAt = ar.getString('received_at') || ''
          var arDueDate = ar.getString('due_date') || ''
          var arRelevant = getRelevantDate(arStatus, arReceivedAt, arDueDate)
          if (!matchesMonth(arRelevant)) continue
          var arCustId = ar.getString('customer_id') || ''
          receitas.push({
            id: ar.id,
            description: ar.getString('description') || '',
            customerName: customerMap[arCustId] || '',
            amount: getEffectiveAmount(ar),
            dueDate: arDueDate,
            receivedAt: arReceivedAt,
            paymentMethod: ar.getString('payment_method') || '',
            status: arStatus,
            bankAccountId: arBaId,
            bankAccountName: getBankAccountName(arBaId),
          })
        }
      }

      var despesas = []
      {
        var apRecs = $app.findRecordsByFilter('accounts_payable', '', '-created', 0, 0)
        for (var y = 0; y < apRecs.length; y++) {
          var ap = apRecs[y]
          var apStatus = ap.getString('status') || ''
          if (!statusMatches(apStatus, false)) continue
          var apBaId = ap.getString('bank_account_id') || ''
          if (bankAccountId && apBaId !== bankAccountId) continue
          var apPaidAt = ap.getString('paid_at') || ''
          var apDueDate = ap.getString('due_date') || ''
          var apRelevant = getRelevantDate(apStatus, apPaidAt, apDueDate)
          if (!matchesMonth(apRelevant)) continue
          var apSupId = ap.getString('supplier_id') || ''
          despesas.push({
            id: ap.id,
            description: ap.getString('description') || '',
            supplierName: supplierMap[apSupId] || '',
            amount: getEffectiveAmount(ap),
            dueDate: apDueDate,
            paidAt: apPaidAt,
            paymentMethod: ap.getString('payment_method') || '',
            paymentMethodCode: ap.getString('payment_method_code') || '',
            status: apStatus,
            bankAccountId: apBaId,
            bankAccountName: getBankAccountName(apBaId),
          })
        }
      }

      var accountStats = {}
      for (var a = 0; a < bankAccounts.length; a++) {
        accountStats[bankAccounts[a].id] = {
          totalReceitas: 0,
          totalDespesas: 0,
          receitasCount: 0,
          despesasCount: 0,
        }
      }
      accountStats[''] = { totalReceitas: 0, totalDespesas: 0, receitasCount: 0, despesasCount: 0 }

      for (var r = 0; r < receitas.length; r++) {
        var rKey = receitas[r].bankAccountId || ''
        if (!accountStats[rKey])
          accountStats[rKey] = {
            totalReceitas: 0,
            totalDespesas: 0,
            receitasCount: 0,
            despesasCount: 0,
          }
        accountStats[rKey].receitasCount++
        if (receitas[r].status === 'Recebido')
          accountStats[rKey].totalReceitas += receitas[r].amount
      }
      for (var d = 0; d < despesas.length; d++) {
        var dKey = despesas[d].bankAccountId || ''
        if (!accountStats[dKey])
          accountStats[dKey] = {
            totalReceitas: 0,
            totalDespesas: 0,
            receitasCount: 0,
            despesasCount: 0,
          }
        accountStats[dKey].despesasCount++
        if (despesas[d].status === 'Pago') accountStats[dKey].totalDespesas += despesas[d].amount
      }

      var accountBreakdown = []
      for (var b = 0; b < bankAccounts.length; b++) {
        var baStats = accountStats[bankAccounts[b].id] || {
          totalReceitas: 0,
          totalDespesas: 0,
          receitasCount: 0,
          despesasCount: 0,
        }
        accountBreakdown.push({
          accountId: bankAccounts[b].id,
          accountName: bankAccounts[b].name,
          tradingName: bankAccounts[b].tradingName,
          totalReceitas: baStats.totalReceitas,
          totalDespesas: baStats.totalDespesas,
          saldo: baStats.totalReceitas - baStats.totalDespesas,
          receitasCount: baStats.receitasCount,
          despesasCount: baStats.despesasCount,
        })
      }
      var noAccount = accountStats[''] || {
        totalReceitas: 0,
        totalDespesas: 0,
        receitasCount: 0,
        despesasCount: 0,
      }
      if (noAccount.receitasCount > 0 || noAccount.despesasCount > 0) {
        accountBreakdown.push({
          accountId: '',
          accountName: 'Sem conta bancária',
          tradingName: 'Sem conta bancária',
          totalReceitas: noAccount.totalReceitas,
          totalDespesas: noAccount.totalDespesas,
          saldo: noAccount.totalReceitas - noAccount.totalDespesas,
          receitasCount: noAccount.receitasCount,
          despesasCount: noAccount.despesasCount,
        })
      }

      var totalReceitas = 0
      var totalDespesas = 0
      for (var tr = 0; tr < receitas.length; tr++) {
        if (receitas[tr].status === 'Recebido') totalReceitas += receitas[tr].amount
      }
      for (var td = 0; td < despesas.length; td++) {
        if (despesas[td].status === 'Pago') totalDespesas += despesas[td].amount
      }

      return e.json(200, {
        month: month,
        bankAccountId: bankAccountId,
        statusFilter: statusFilter,
        bankAccounts: bankAccounts,
        summary: {
          totalReceitas: totalReceitas,
          totalDespesas: totalDespesas,
          saldo: totalReceitas - totalDespesas,
        },
        accountBreakdown: accountBreakdown,
        receitas: receitas,
        despesas: despesas,
      })
    } catch (err) {
      $app.logger().error('bank-map aggregation failed', 'error', String(err))
      return e.json(500, { error: String((err && err.message) || err) })
    }
  },
  $apis.requireAuth(),
)
