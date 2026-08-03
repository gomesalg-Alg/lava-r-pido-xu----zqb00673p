onRecordCreateRequest((e) => {
  var name = e.record.getString('name')
  if (name === 'Consumidor Final') {
    e.next()
    return
  }

  var tipoPessoa = e.record.getString('tipo_pessoa')

  if (tipoPessoa === 'F') {
    var cpf = e.record.getString('cpf')
    if (!cpf) {
      return e.badRequestError('CPF é obrigatório para pessoa física')
    }
    var d = cpf.replace(/\D/g, '')
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) {
      return e.badRequestError('CPF inválido')
    }
    var sum = 0
    for (var i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
    var rev = 11 - (sum % 11)
    if (rev >= 10) rev = 0
    if (rev !== parseInt(d[9])) return e.badRequestError('CPF inválido')
    sum = 0
    for (var i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
    rev = 11 - (sum % 11)
    if (rev >= 10) rev = 0
    if (rev !== parseInt(d[10])) return e.badRequestError('CPF inválido')
  } else if (tipoPessoa === 'J') {
    var cnpj = e.record.getString('cnpj')
    if (!cnpj) {
      return e.badRequestError('CNPJ é obrigatório para pessoa jurídica')
    }
    var d = cnpj.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (d.length !== 14 || /^([A-Z0-9])\1{13}$/.test(d)) {
      return e.badRequestError('CNPJ inválido')
    }
    var w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    var sum = 0
    for (var i = 0; i < 12; i++) sum += (d[i].charCodeAt(0) - 48) * w1[i]
    var d1 = sum % 11
    d1 = d1 < 2 ? 0 : 11 - d1
    if (d1 !== d[12].charCodeAt(0) - 48) return e.badRequestError('CNPJ inválido')
    var w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0
    for (var i = 0; i < 13; i++) sum += (d[i].charCodeAt(0) - 48) * w2[i]
    var d2 = sum % 11
    d2 = d2 < 2 ? 0 : 11 - d2
    if (d2 !== d[13].charCodeAt(0) - 48) return e.badRequestError('CNPJ inválido')
  } else {
    return e.badRequestError('Tipo de pessoa é obrigatório')
  }

  e.next()
}, 'customers')
