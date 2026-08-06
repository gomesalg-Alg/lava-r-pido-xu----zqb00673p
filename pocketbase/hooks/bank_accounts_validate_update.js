onRecordUpdateRequest((e) => {
  if (e.record.getBool('registers_cash_register')) {
    var existing = null
    try {
      existing = $app.findFirstRecordByFilter('bank_accounts', 'registers_cash_register = true')
    } catch (_) {}
    if (existing && existing.id !== e.record.id) {
      throw new BadRequestError('Dados inválidos', {
        registers_cash_register:
          'Já existe uma conta bancária configurada para registrar o Frente de Caixa',
      })
    }
  }
  e.next()
}, 'bank_accounts')
