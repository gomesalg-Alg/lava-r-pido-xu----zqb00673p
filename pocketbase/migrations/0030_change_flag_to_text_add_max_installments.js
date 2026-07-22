migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('card_rates')

    col.removeIndex('idx_card_rates_flag')

    const oldFlag = col.fields.getByName('flag')
    if (oldFlag) {
      col.fields.removeById(oldFlag.id)
    }
    col.fields.add(new TextField({ name: 'flag', required: true }))

    if (!col.fields.getByName('max_installments')) {
      col.fields.add(new NumberField({ name: 'max_installments', onlyInt: true, min: 1, max: 4 }))
    }

    app.save(col)

    try {
      const records = app.findRecordsByFilter('card_rates', 'id != ""', '', 0, 0)
      for (const record of records) {
        if (!record.get('max_installments')) {
          record.set('max_installments', 4)
          app.save(record)
        }
      }
    } catch (_) {}

    app
      .db()
      .newQuery(`
      DELETE FROM card_rates WHERE id NOT IN (
        SELECT MIN(id) FROM card_rates GROUP BY flag
      ) AND flag IS NOT NULL AND flag != ''
    `)
      .execute()

    col.addIndex('idx_card_rates_flag', true, 'flag', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('card_rates')

    col.removeIndex('idx_card_rates_flag')

    const textFlag = col.fields.getByName('flag')
    if (textFlag) {
      col.fields.removeById(textFlag.id)
    }
    col.fields.add(
      new SelectField({ name: 'flag', required: true, values: ['Visa', 'Mastercard', 'Elo'] }),
    )

    const maxField = col.fields.getByName('max_installments')
    if (maxField) {
      col.fields.removeById(maxField.id)
    }

    col.addIndex('idx_card_rates_flag', true, 'flag', '')

    app.save(col)
  },
)
