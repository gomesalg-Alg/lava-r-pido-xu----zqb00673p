migrate(
  (app) => {
    app.db().newQuery('DELETE FROM order_payments').execute()
    app.db().newQuery('DELETE FROM accounts_receivable').execute()
    app.db().newQuery('DELETE FROM vendas_avulsas').execute()
    app.db().newQuery('DELETE FROM service_order_items').execute()
    app.db().newQuery('DELETE FROM service_orders').execute()
  },
  (app) => {},
)
