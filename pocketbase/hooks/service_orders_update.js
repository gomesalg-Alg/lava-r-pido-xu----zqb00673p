onRecordUpdateRequest((e) => {
  if (e.auth) {
    e.record.set('updated_by', e.auth.id)
    var originalCreatedBy = e.record.original().getString('created_by')
    if (originalCreatedBy) {
      e.record.set('created_by', originalCreatedBy)
    }
  }
  var vehicleId = e.record.getString('vehicle_id')
  if (vehicleId) {
    try {
      var vehicle = $app.findRecordById('vehicles', vehicleId)
      e.record.set('placa', vehicle.getString('placa'))
    } catch (_) {}
  }
  e.next()
}, 'service_orders')
