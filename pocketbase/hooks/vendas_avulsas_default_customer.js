onRecordCreateRequest((e) => {
  var customerId = e.record.getString('customer_id')

  if (customerId) {
    e.next()
    return
  }

  try {
    var consumidor = $app.findFirstRecordByData('customers', 'name', 'Consumidor Final')
    e.record.set('customer_id', consumidor.id)
  } catch (err) {
    console.log('Failed to find Consumidor Final customer: ' + err.message)
  }

  e.next()
}, 'vendas_avulsas')
