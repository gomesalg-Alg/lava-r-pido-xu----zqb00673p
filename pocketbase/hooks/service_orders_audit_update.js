onRecordAfterUpdateSuccess((e) => {
  var record = e.record
  var userId = record.getString('updated_by')
  if (!userId) return e.next()

  try {
    var auditCol = $app.findCollectionByNameOrId('audit_logs')
    var audit = new Record(auditCol)
    audit.set('user_id', userId)
    audit.set('action', 'UPDATE')
    audit.set('resource', 'service_orders')
    audit.set('resource_id', record.id)
    var ticket = record.get('ticket_number') || 0
    audit.set('details', 'Ordem de serviço #' + String(ticket).padStart(4, '0') + ' atualizada')
    $app.save(audit)
  } catch (err) {
    console.log('audit log creation failed: ' + err.message)
  }

  return e.next()
}, 'service_orders')
