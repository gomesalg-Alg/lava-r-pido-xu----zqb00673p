migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('account_categories')

    const seeds = [
      { name: 'Receitas', code: '1', type: 'Receita', nature: 'Sintética', parent: null },
      { name: 'Serviços', code: '1.1', type: 'Receita', nature: 'Sintética', parent: '1' },
      {
        name: 'Lavagem Completa',
        code: '1.1.01',
        type: 'Receita',
        nature: 'Analítica',
        parent: '1.1',
      },
      {
        name: 'Lavagem Simples',
        code: '1.1.02',
        type: 'Receita',
        nature: 'Analítica',
        parent: '1.1',
      },
      { name: 'Enceramento', code: '1.1.03', type: 'Receita', nature: 'Analítica', parent: '1.1' },
      { name: 'Polimento', code: '1.1.04', type: 'Receita', nature: 'Analítica', parent: '1.1' },
      {
        name: 'Higienização Interna',
        code: '1.1.05',
        type: 'Receita',
        nature: 'Analítica',
        parent: '1.1',
      },
      { name: 'Venda de Produtos', code: '1.2', type: 'Receita', nature: 'Sintética', parent: '1' },
      {
        name: 'Shampoos e Ceras',
        code: '1.2.01',
        type: 'Receita',
        nature: 'Analítica',
        parent: '1.2',
      },
      {
        name: 'Acessórios Automotivos',
        code: '1.2.02',
        type: 'Receita',
        nature: 'Analítica',
        parent: '1.2',
      },
      { name: 'Despesas', code: '2', type: 'Despesa', nature: 'Sintética', parent: null },
      { name: 'Insumos', code: '2.1', type: 'Despesa', nature: 'Sintética', parent: '2' },
      { name: 'Shampoo', code: '2.1.01', type: 'Despesa', nature: 'Analítica', parent: '2.1' },
      { name: 'Cera', code: '2.1.02', type: 'Despesa', nature: 'Analítica', parent: '2.1' },
      {
        name: 'Produtos de Limpeza',
        code: '2.1.03',
        type: 'Despesa',
        nature: 'Analítica',
        parent: '2.1',
      },
      {
        name: 'Esfregões e Panos',
        code: '2.1.04',
        type: 'Despesa',
        nature: 'Analítica',
        parent: '2.1',
      },
      { name: 'Utilidades', code: '2.2', type: 'Despesa', nature: 'Sintética', parent: '2' },
      { name: 'Água', code: '2.2.01', type: 'Despesa', nature: 'Analítica', parent: '2.2' },
      {
        name: 'Energia Elétrica',
        code: '2.2.02',
        type: 'Despesa',
        nature: 'Analítica',
        parent: '2.2',
      },
      {
        name: 'Internet e Telefone',
        code: '2.2.03',
        type: 'Despesa',
        nature: 'Analítica',
        parent: '2.2',
      },
      { name: 'Mão de Obra', code: '2.3', type: 'Despesa', nature: 'Sintética', parent: '2' },
      { name: 'Salários', code: '2.3.01', type: 'Despesa', nature: 'Analítica', parent: '2.3' },
      { name: 'Comissões', code: '2.3.02', type: 'Despesa', nature: 'Analítica', parent: '2.3' },
      {
        name: 'Encargos Sociais',
        code: '2.3.03',
        type: 'Despesa',
        nature: 'Analítica',
        parent: '2.3',
      },
      { name: 'Aluguel', code: '2.4', type: 'Despesa', nature: 'Sintética', parent: '2' },
      {
        name: 'Aluguel do Imóvel',
        code: '2.4.01',
        type: 'Despesa',
        nature: 'Analítica',
        parent: '2.4',
      },
      { name: 'Condomínio', code: '2.4.02', type: 'Despesa', nature: 'Analítica', parent: '2.4' },
      { name: 'Marketing', code: '2.5', type: 'Despesa', nature: 'Sintética', parent: '2' },
      {
        name: 'Mídias Sociais',
        code: '2.5.01',
        type: 'Despesa',
        nature: 'Analítica',
        parent: '2.5',
      },
      {
        name: 'Material Gráfico',
        code: '2.5.02',
        type: 'Despesa',
        nature: 'Analítica',
        parent: '2.5',
      },
    ]

    const codeToId = {}

    for (const s of seeds) {
      try {
        app.findFirstRecordByData('account_categories', 'code', s.code)
      } catch (_) {
        const record = new Record(col)
        record.set('name', s.name)
        record.set('code', s.code)
        record.set('type', s.type)
        record.set('nature', s.nature)
        if (s.parent && codeToId[s.parent]) {
          record.set('parent_id', codeToId[s.parent])
        }
        app.save(record)
        codeToId[s.code] = record.id
      }
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('account_categories', "code != ''", '', 200, 0)
      for (const r of records) {
        app.delete(r)
      }
    } catch (_) {}
  },
)
