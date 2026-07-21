migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.emailVisibility = true
    app.save(col)

    app.db().newQuery('UPDATE users SET emailVisibility = 1').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.emailVisibility = false
    app.save(col)

    app.db().newQuery('UPDATE users SET emailVisibility = 0').execute()
  },
)
