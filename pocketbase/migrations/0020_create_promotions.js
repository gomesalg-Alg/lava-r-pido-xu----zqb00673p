migrate(
  (app) => {
    const promotions = new Collection({
      name: 'promotions',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != '' && @request.auth.role = 'Administrador'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'Administrador'",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'image',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'is_active', type: 'bool' },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(promotions)

    const companyCol = app.findCollectionByNameOrId('company')
    if (!companyCol.fields.getByName('popup_enabled')) {
      companyCol.fields.add(new BoolField({ name: 'popup_enabled' }))
    }
    app.save(companyCol)

    app.db().newQuery('UPDATE company SET popup_enabled = 1 WHERE popup_enabled IS NULL').execute()
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('promotions'))
    } catch (_) {}

    const companyCol = app.findCollectionByNameOrId('company')
    const field = companyCol.fields.getByName('popup_enabled')
    if (field) {
      companyCol.fields.remove(field.getId())
      app.save(companyCol)
    }
  },
)
