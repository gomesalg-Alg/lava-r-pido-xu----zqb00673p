migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company')
    if (!col.fields.getByName('home_page')) {
      col.fields.add(
        new URLField({
          name: 'home_page',
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company')
    const field = col.fields.getByName('home_page')
    if (field) {
      col.fields.remove(field.getId())
      app.save(col)
    }
  },
)
