onRecordUpdateRequest((e) => {
  if (e.record.getBool('registers_cash_register')) {
    var existing = null
    try {
      existing = $app.findFirstRecordByFilter('bank_accounts', 'registers_cash_register = true')
    } catch (_) {}
    if (existing && existing.id !== e.record.id) {
      var message =
        "Apenas uma conta bancária pode estar com 'Registra movimentos do Frente de Caixa' marcado como Sim. Desmarque a opção na conta atual para configurar esta."
      throw new BadRequestError('Dados inválidos', {
        registers_cash_register: message,
      })
    }
  }
  e.next()
}, 'bank_accounts')
