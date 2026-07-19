migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    const auditLogs = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.role = 'Administrador'",
      viewRule: "@request.auth.id != '' && @request.auth.role = 'Administrador'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'action', type: 'text', required: true },
        { name: 'resource', type: 'text', required: true },
        { name: 'resource_id', type: 'text', required: true },
        { name: 'details', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audit_logs_resource_id_created ON audit_logs (resource_id, created DESC)',
      ],
    })

    app.save(auditLogs)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('audit_logs'))
    } catch (_) {}
  },
)
