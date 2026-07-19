onRecordCreateRequest((e) => {
  if (e.auth) {
    e.record.set('created_by', e.auth.id)
  }
  e.next()
}, 'service_orders')
