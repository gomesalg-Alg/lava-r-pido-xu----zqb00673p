onRecordDeleteRequest((e) => {
  var status = e.record.getString('status')

  if (status === 'Pago') {
    var isGestor = e.auth && e.auth.getString('role') === 'Gestor de Compras'
    var hasPurchaseOrder = e.record.getString('purchase_order_id') !== ''

    if (isGestor && hasPurchaseOrder) {
      return e.next()
    }

    return e.badRequestError('Registros com status "Pago" não podem ser excluídos.')
  }

  e.next()
}, 'accounts_payable')
