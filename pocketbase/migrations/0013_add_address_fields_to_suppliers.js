migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('suppliers')
    const fieldsToAdd = [
      { name: 'cep', type: 'text' },
      { name: 'complement', type: 'text' },
      { name: 'neighborhood', type: 'text' },
      { name: 'city', type: 'text' },
      { name: 'state', type: 'text' },
    ]
    for (const f of fieldsToAdd) {
      if (!col.fields.getByName(f.name)) {
        col.fields.add(new TextField({ name: f.name }))
      }
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('suppliers')
    const fieldsToRemove = ['cep', 'complement', 'neighborhood', 'city', 'state']
    for (const fName of fieldsToRemove) {
      const field = col.fields.getByName(fName)
      if (field) {
        col.fields.remove(field.getId())
      }
    }
    app.save(col)
  },
)
