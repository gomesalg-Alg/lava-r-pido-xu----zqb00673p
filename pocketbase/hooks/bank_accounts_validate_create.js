onRecordCreateRequest((e) => {
  if (e.record.getBool('registers_cash_register')) {
    var existing = null
    try {
      existing = $app.findFirstRecordByFilter('bank_accounts', 'registers_cash_register = true')
    } catch (_) {}
    if (existing) {
      var message =
        "Apenas uma conta bancária pode estar com 'Registra movimentos do Frente de Caixa' marcado como Sim."
      throw new BadRequestError('Dados inválidos', {
        registers_cash_register: message,
      })
    }
  }
  e.next()
}, 'bank_accounts')
