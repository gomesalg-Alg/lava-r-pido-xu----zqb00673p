migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'Administrador')"
    col.deleteRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'Administrador')"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.updateRule = 'id = @request.auth.id'
    col.deleteRule = 'id = @request.auth.id'
    app.save(col)
  },
)
