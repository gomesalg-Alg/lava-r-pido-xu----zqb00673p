onRecordDeleteRequest((e) => {
  var status = e.record.getString('status')

  if (status === 'Pago') {
    return e.badRequestError('Registros com status "Pago" não podem ser excluídos.')
  }

  e.next()
}, 'service_orders')
