onRecordUpdateRequest((e) => {
  var currentStatus = e.record.original().getString('status')
  var newStatus = e.record.getString('status')

  if (currentStatus === 'Pago' && newStatus !== 'Cancelado') {
    return e.badRequestError(
      'Registros com status "Pago" não podem ser alterados. Cancele a venda para liberar o registro.',
    )
  }

  e.next()
}, 'service_orders')
