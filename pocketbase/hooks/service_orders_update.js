onRecordUpdateRequest((e) => {
  if (e.auth) {
    e.record.set('updated_by', e.auth.id)
    var originalCreatedBy = e.record.original().getString('created_by')
    if (originalCreatedBy) {
      e.record.set('created_by', originalCreatedBy)
    }
  }
  e.next()
}, 'service_orders')
