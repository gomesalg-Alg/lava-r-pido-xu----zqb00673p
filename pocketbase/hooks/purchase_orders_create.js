onRecordCreateRequest((e) => {
  if (e.auth) {
    e.record.set('created_by', e.auth.id)
  }
  if (!e.record.getString('status')) {
    e.record.set('status', 'Aberto')
  }
  if (!e.record.getString('order_number')) {
    var count = $app.countRecords('purchase_orders')
    var year = new Date().getFullYear()
    e.record.set('order_number', 'PC-' + year + '-' + String(count + 1).padStart(4, '0'))
  }
  e.next()
}, 'purchase_orders')
