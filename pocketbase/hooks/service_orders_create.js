onRecordCreateRequest((e) => {
  if (e.auth) {
    e.record.set('created_by', e.auth.id)
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
