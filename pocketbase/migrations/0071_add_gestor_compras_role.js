migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('_pb_users_auth_')
    var field = col.fields.getByName('role')
    if (field) {
      col.fields.removeById(field.getId())
    }
    col.fields.add(
      new SelectField({
        name: 'role',
        values: ['Administrador', 'Operador', 'Gestor de Compras'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('_pb_users_auth_')
    var field = col.fields.getByName('role')
    if (field) {
      col.fields.removeById(field.getId())
    }
    col.fields.add(
      new SelectField({
        name: 'role',
        values: ['Administrador', 'Operador'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
)
