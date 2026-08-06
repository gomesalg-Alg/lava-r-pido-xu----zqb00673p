onRecordUpdateRequest((e) => {
  if (e.record.getBool('registers_cash_register')) {
    var existing = null
    try {
      existing = $app.findFirstRecordByFilter('bank_accounts', 'registers_cash_register = true')
    } catch (_) {}
    if (existing && existing.id !== e.record.id) {
      var bankName = existing.getString('name') || ''
      var agency = existing.getString('agency') || ''
      var accountNumber = existing.getString('account_number') || ''
      var message =
        'Já existe uma conta bancária configurada para registrar os movimentos do Frente de Caixa: ' +
        bankName +
        ' – Agência ' +
        agency +
        ' / Conta ' +
        accountNumber +
        '. Desmarque a opção na conta atual para configurar esta.'
      throw new BadRequestError('Dados inválidos', {
        registers_cash_register: message,
      })
    }
  }
  e.next()
}, 'bank_accounts')
