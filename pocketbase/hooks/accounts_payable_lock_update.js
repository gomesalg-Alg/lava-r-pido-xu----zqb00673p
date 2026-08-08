onRecordUpdateRequest((e) => {
  var currentStatus = e.record.original().getString('status')

  if (currentStatus === 'Pago') {
    return e.badRequestError('Registros com status "Pago" não podem ser alterados.')
  }

  e.next()
}, 'accounts_payable')
