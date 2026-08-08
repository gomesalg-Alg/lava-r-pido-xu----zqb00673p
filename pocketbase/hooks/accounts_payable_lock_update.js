onRecordUpdateRequest((e) => {
  var currentStatus = e.record.original().getString('status')

  if (currentStatus === 'Pago') {
    var isGestor = e.auth && e.auth.getString('role') === 'Gestor de Compras'
    var hasPurchaseOrder = e.record.original().getString('purchase_order_id') !== ''

    if (isGestor && hasPurchaseOrder) {
      return e.next()
    }

    return e.badRequestError('Registros com status "Pago" não podem ser alterados.')
  }

  e.next()
}, 'accounts_payable')
