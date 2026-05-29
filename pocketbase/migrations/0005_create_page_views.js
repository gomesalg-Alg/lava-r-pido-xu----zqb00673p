migrate(
  (app) => {
    const collection = new Collection({
      name: 'page_views',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '',
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'path', type: 'text', required: true },
        { name: 'user_agent', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_page_views_path_created ON page_views (path, created DESC)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('page_views')
    app.delete(collection)
  },
)
