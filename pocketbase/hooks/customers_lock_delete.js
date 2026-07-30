onRecordDeleteRequest((e) => {
  var name = e.record.getString('name')

  if (name === 'Consumidor Final') {
    return e.badRequestError('Consumidor Final cannot be deleted')
  }

  e.next()
}, 'customers')
