migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!col.fields.getByName('role')) {
      col.fields.add(
        new SelectField({
          name: 'role',
          values: ['Administrador', 'Operador'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)

    app
      .db()
      .newQuery("UPDATE users SET role = 'Operador' WHERE role IS NULL OR role = ''")
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    const field = col.fields.getByName('role')
    if (field) {
      col.fields.remove(field.getId())
      app.save(col)
    }
  },
)
