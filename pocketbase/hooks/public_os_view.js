routerAdd('GET', '/backend/v1/public/os/{id}', (e) => {
  const id = e.request.pathValue('id')
  if (!id) return e.notFoundError('Ordem não encontrada')

  try {
    const order = $app.findRecordById('service_orders', id)
    $app.expandRecord(order, ['customer_id', 'vehicle_id'])

    let items = []
    try {
      items = $app.findRecordsByFilter(
        'service_order_items',
        'order_id = "' + id + '"',
        'created',
        0,
        0,
      )
      for (let j = 0; j < items.length; j++) {
        $app.expandRecord(items[j], ['service_id', 'operator_id'])
      }
    } catch (_) {}

    let company = null
    try {
      company = $app.findFirstRecordByFilter('company', "id != ''")
    } catch (_) {}

    return e.json(200, {
      order: order.publicExport(),
      items: items.map(function (i) {
        return i.publicExport()
      }),
      company: company ? company.publicExport() : null,
    })
  } catch (err) {
    return e.notFoundError('Ordem não encontrada')
  }
})
