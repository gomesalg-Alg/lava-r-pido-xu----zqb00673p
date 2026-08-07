migrate(
  (app) => {
    var categoriesCol = app.findCollectionByNameOrId('account_categories')

    var servicesCol = app.findCollectionByNameOrId('services')
    if (!servicesCol.fields.getByName('account_category_id')) {
      servicesCol.fields.add(
        new RelationField({
          name: 'account_category_id',
          required: false,
          collectionId: categoriesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    servicesCol.addIndex('idx_services_account_category_id', false, 'account_category_id', '')
    app.save(servicesCol)

    var productsCol = app.findCollectionByNameOrId('products')
    if (!productsCol.fields.getByName('account_category_id')) {
      productsCol.fields.add(
        new RelationField({
          name: 'account_category_id',
          required: false,
          collectionId: categoriesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    productsCol.addIndex('idx_products_account_category_id', false, 'account_category_id', '')
    app.save(productsCol)

    var defaultCategoryId = ''
    try {
      var defaultCat = app.findFirstRecordByData('account_categories', 'name', 'Lavagem Simples')
      defaultCategoryId = defaultCat.id
    } catch (_) {
      try {
        var defaultCat2 = app.findFirstRecordByData(
          'account_categories',
          'name',
          'Lavagem Completa',
        )
        defaultCategoryId = defaultCat2.id
      } catch (_) {}
    }

    if (defaultCategoryId) {
      var services = app.findRecordsByFilter(
        'services',
        "account_category_id = '' || account_category_id = null",
        'created',
        0,
        0,
      )
      for (var i = 0; i < services.length; i++) {
        services[i].set('account_category_id', defaultCategoryId)
        app.save(services[i])
      }

      var products = app.findRecordsByFilter(
        'products',
        "account_category_id = '' || account_category_id = null",
        'created',
        0,
        0,
      )
      for (var j = 0; j < products.length; j++) {
        products[j].set('account_category_id', defaultCategoryId)
        app.save(products[j])
      }
    }
  },
  (app) => {
    var servicesCol = app.findCollectionByNameOrId('services')
    var sf = servicesCol.fields.getByName('account_category_id')
    if (sf) servicesCol.fields.remove(sf.getId())
    servicesCol.removeIndex('idx_services_account_category_id')
    app.save(servicesCol)

    var productsCol = app.findCollectionByNameOrId('products')
    var pf = productsCol.fields.getByName('account_category_id')
    if (pf) productsCol.fields.remove(pf.getId())
    productsCol.removeIndex('idx_products_account_category_id')
    app.save(productsCol)
  },
)
