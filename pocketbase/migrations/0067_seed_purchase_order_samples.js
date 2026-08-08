migrate(
  (app) => {
    var supplierCount = app.countRecords('suppliers')
    if (supplierCount === 0) {
      var sCol = app.findCollectionByNameOrId('suppliers')
      var sSeeds = [
        {
          name: 'Distribuidora Auto Clean Ltda',
          cnpj: '12.345.678/0001-90',
          phone: '(11) 3456-7890',
          email: 'contato@autoclean.com.br',
          address: 'Rua das Industrias, 500 - São Paulo/SP',
          tipo_pessoa: 'J',
        },
        {
          name: 'Quimica Brasil S.A.',
          cnpj: '98.765.432/0001-10',
          phone: '(11) 9876-5432',
          email: 'vendas@quimicabrasil.com.br',
          address: 'Av. Paulista, 1000 - São Paulo/SP',
          tipo_pessoa: 'J',
        },
      ]
      for (var i = 0; i < sSeeds.length; i++) {
        var s = sSeeds[i]
        var sRec = new Record(sCol)
        sRec.set('name', s.name)
        sRec.set('cnpj', s.cnpj)
        sRec.set('phone', s.phone)
        sRec.set('email', s.email)
        sRec.set('address', s.address)
        sRec.set('tipo_pessoa', s.tipo_pessoa)
        app.save(sRec)
      }
    }

    var productCount = app.countRecords('products')
    if (productCount === 0) {
      var pCol = app.findCollectionByNameOrId('products')
      var pSeeds = [
        { name: 'Shampoo Automotivo 5L', price: 35.0, sku: 'LAV001', stock_quantity: 20 },
        { name: 'Cera Protetora 1L', price: 28.0, sku: 'LAV002', stock_quantity: 15 },
        { name: 'Detergente Desengordurante 1L', price: 18.0, sku: 'LAV003', stock_quantity: 30 },
        { name: 'Silicone Painel 500ml', price: 22.0, sku: 'LAV004', stock_quantity: 12 },
      ]
      for (var j = 0; j < pSeeds.length; j++) {
        var p = pSeeds[j]
        var pRec = new Record(pCol)
        pRec.set('name', p.name)
        pRec.set('price', p.price)
        pRec.set('sku', p.sku)
        pRec.set('stock_quantity', p.stock_quantity)
        app.save(pRec)
      }
    }
  },
  (app) => {},
)
