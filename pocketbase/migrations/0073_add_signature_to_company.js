migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company')
    if (!col.fields.getByName('signature')) {
      col.fields.add(
        new FileField({
          name: 'signature',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company')
    const field = col.fields.getByName('signature')
    if (field) {
      col.fields.removeByName('signature')
      app.save(col)
    }
  },
)
