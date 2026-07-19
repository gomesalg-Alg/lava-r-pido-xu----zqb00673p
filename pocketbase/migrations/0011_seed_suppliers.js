migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('suppliers')
    const seeds = [
      {
        name: 'Distribuidora Auto Clean Ltda',
        cnpj: '12.345.678/0001-90',
        phone: '(11) 3456-7890',
        email: 'contato@autoclean.com.br',
        address: 'Rua das Industrias, 500 - São Paulo/SP',
      },
      {
        name: 'Quimica Brasil S.A.',
        cnpj: '98.765.432/0001-10',
        phone: '(11) 9876-5432',
        email: 'vendas@quimicabrasil.com.br',
        address: 'Av. Paulista, 1000 - São Paulo/SP',
      },
      {
        name: 'Auto Peças Cruz Alta',
        cnpj: '45.678.901/0001-23',
        phone: '(19) 2345-6789',
        email: 'comercial@cruzalta.com.br',
        address: 'Rod. Anhanguera, km 120 - Campinas/SP',
      },
    ]
    for (const s of seeds) {
      try {
        app.findFirstRecordByData('suppliers', 'name', s.name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', s.name)
        record.set('cnpj', s.cnpj)
        record.set('phone', s.phone)
        record.set('email', s.email)
        record.set('address', s.address)
        app.save(record)
      }
    }
  },
  (app) => {
    const records = app.findRecordsByFilter('suppliers', "name != ''", '', 100, 0)
    for (const r of records) {
      app.delete(r)
    }
  },
)
