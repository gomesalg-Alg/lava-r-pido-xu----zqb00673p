migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('promotions')
    if (!col.fields.getByName('expires_at')) {
      col.fields.add(new DateField({ name: 'expires_at' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('promotions')
    const field = col.fields.getByName('expires_at')
    if (field) {
      col.fields.remove(field.getId())
      app.save(col)
    }
  },
)
