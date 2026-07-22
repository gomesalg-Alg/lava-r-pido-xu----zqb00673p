migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('products')

    var seeds = [
      { name: 'Coca-Cola Lata 350ml', price: 6.0, sku: 'BEB001', stock_quantity: 48 },
      { name: 'Água Mineral 500ml', price: 4.0, sku: 'BEB002', stock_quantity: 60 },
      { name: 'Guaraná Antarctica Lata', price: 6.0, sku: 'BEB003', stock_quantity: 36 },
      { name: 'Red Bull 250ml', price: 12.0, sku: 'BEB004', stock_quantity: 24 },
      { name: 'Doritos 100g', price: 8.5, sku: 'SNK001', stock_quantity: 30 },
      { name: 'M&M 45g', price: 5.0, sku: 'SNK002', stock_quantity: 40 },
      { name: 'Trident Menta', price: 3.0, sku: 'SNK003', stock_quantity: 50 },
      { name: 'Bis 40g', price: 4.5, sku: 'SNK004', stock_quantity: 35 },
    ]

    for (var i = 0; i < seeds.length; i++) {
      var s = seeds[i]
      try {
        app.findFirstRecordByData('products', 'sku', s.sku)
      } catch (_) {
        var record = new Record(col)
        record.set('name', s.name)
        record.set('price', s.price)
        record.set('sku', s.sku)
        record.set('stock_quantity', s.stock_quantity)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('products'))
    } catch (_) {}
  },
)
