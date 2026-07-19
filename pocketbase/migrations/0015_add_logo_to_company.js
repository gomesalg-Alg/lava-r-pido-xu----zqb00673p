migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company')
    if (!col.fields.getByName('logo')) {
      col.fields.add(
        new FileField({
          name: 'logo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company')
    const field = col.fields.getByName('logo')
    if (field) {
      col.fields.remove(field.getId())
      app.save(col)
    }
  },
)
