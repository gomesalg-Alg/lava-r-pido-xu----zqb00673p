/// <reference path="../pb_data/types.d.ts" />
//
// Limpa TODOS os movimentos de VENDA e COMPRA do sistema, preservando
// apenas os cadastros (clientes, veículos, fornecedores, serviços,
// produtos, materiais, usuários, empresa, promoções, categorias de contas,
// taxas de cartão, contas bancárias, logs de auditoria, etc.).
//
// Também remove todos os registros de monitoramento (page_views).
//
// A exclusão é feita diretamente no banco via SQL (app.db().newQuery),
// ignorando hooks/regras da aplicação, para que funcione com qualquer
// status (Pago, Pendente, Cancelado, etc.). Em cascata: itens filhos
// antes dos pais. Idempotente.
migrate(
  (app) => {
    // Tabelas a serem limpas, na ordem de dependência (filhos antes dos pais).
    // "page_views" (monitoramento) também é incluída.
    // Cadastros NÃO são tocados: customers, vehicles, suppliers, services,
    // products, company, users, promotions, account_categories, card_rates,
    // bank_accounts, audit_logs.
    const tablesToClear = [
      // --- Fluxo de COMPRA ---
      'purchase_order_items', // itens dos pedidos de compra
      'accounts_payable', // contas a pagar (referenciam purchase_orders)
      'purchase_orders', // pedidos de compra

      // --- Fluxo de VENDA ---
      'service_order_items', // itens das OS (referenciam service_orders)
      'order_payments', // pagamentos de OS / vendas avulsas
      'accounts_receivable', // contas a receber (referenciam service_orders / vendas_avulsas)
      'vendas_avulsas', // vendas avulsas
      'service_orders', // ordens de serviço

      // --- Monitoramento ---
      'page_views',
    ]

    tablesToClear.forEach((table) => {
      if (app.hasTable(table)) {
        app
          .db()
          .newQuery('DELETE FROM ' + table)
          .execute()
      }
    })

    // Log resumido para fins de auditoria da migração.
    const counts = tablesToClear.map((table) => {
      if (!app.hasTable(table)) return table + '=skip'
      const total = app.countRecords(table)
      return table + '=' + total
    })
    console.log('0075_clear_sales_purchase_movements: ' + counts.join(', '))
  },
  (app) => {
    // Down intencionalmente vazio: a exclusão de movimentos é irreversível
    // e os dados apagados não podem ser recriados automaticamente.
  },
)
