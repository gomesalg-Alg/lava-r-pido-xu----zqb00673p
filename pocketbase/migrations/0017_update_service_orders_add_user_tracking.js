migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')

    if (!col.fields.getByName('created_by')) {
      col.fields.add(
        new RelationField({
          name: 'created_by',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('updated_by')) {
      col.fields.add(
        new RelationField({
          name: 'updated_by',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')

    const createdField = col.fields.getByName('created_by')
    if (createdField) {
      col.fields.remove(createdField.getId())
    }

    const updatedField = col.fields.getByName('updated_by')
    if (updatedField) {
      col.fields.remove(updatedField.getId())
    }

    app.save(col)
  },
)
