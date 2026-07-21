migrate(
  (app) => {
    const collection = new Collection({
      name: 'account_categories',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'code', type: 'text' },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Receita', 'Despesa'],
          maxSelect: 1,
        },
        {
          name: 'nature',
          type: 'select',
          required: true,
          values: ['Sintética', 'Analítica'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_account_categories_code ON account_categories (code)'],
    })
    app.save(collection)

    const col = app.findCollectionByNameOrId('account_categories')
    col.fields.add(
      new RelationField({
        name: 'parent_id',
        required: false,
        collectionId: col.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('account_categories'))
    } catch (_) {}
  },
)
