migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('card_rates')

    const flags = [
      { flag: 'Visa', debit: 2.79, c1: 5.99, c2: 11.39, c3: 12.49, c4: 13.09 },
      { flag: 'Mastercard', debit: 2.79, c1: 5.99, c2: 11.39, c3: 12.49, c4: 13.09 },
      { flag: 'Elo', debit: 2.79, c1: 5.99, c2: 11.39, c3: 12.49, c4: 13.09 },
    ]

    for (const f of flags) {
      try {
        app.findFirstRecordByData('card_rates', 'flag', f.flag)
      } catch (_) {
        const record = new Record(col)
        record.set('flag', f.flag)
        record.set('debit_rate', f.debit)
        record.set('credit_1x_rate', f.c1)
        record.set('credit_2x_rate', f.c2)
        record.set('credit_3x_rate', f.c3)
        record.set('credit_4x_rate', f.c4)
        record.set('is_active', true)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('card_rates')
      app.truncateCollection(col)
    } catch (_) {}
  },
)
