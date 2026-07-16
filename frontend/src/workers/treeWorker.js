const buildTree = (data, fields, depth = 0) => {
  if (depth >= fields.length || data.length === 0) return null;
  const field = fields[depth];

  const grouped = data.reduce((acc, row) => {
    const key = row[field] || '(vazio)';
    if (!acc[key]) {
      acc[key] = {
        key,
        field,
        depth,
        rows: [],
        metrics: { 
          count: 0, valMaxAtual: 0, valMaxNovo: 0, mediaVendaMensal: 0, lucroBruto: 0, estoqueCusto: 0, qtdMinNovo: 0, qtdMaxNovo: 0, activeSkus: new Set(),
          perfVendaTotal: 0, perfQtdTotal: 0, perfLucroTotal: 0,
          perfRebaixoValor: 0, perfRebaixoQtd: 0, perfRebaixoLucro: 0,
          perfEncarteValor: 0, perfEncarteQtd: 0, perfEncarteLucro: 0,
          perfTvValor: 0, perfTvQtd: 0, perfTvLucro: 0,
          perfPerdaTotal: 0
        }
      };
    }
    acc[key].rows.push(row);
    
    const preco = parseFloat(row.PRECO_VAREJO) || 0;
    const custo = parseFloat(row.CUSTO_GERENC) || 0;
    
    let qtdMin = parseFloat(row.QTD_MIN_REAL) || 0;
    let qtdMax = parseFloat(row.QTD_MAX_REAL) || 0;

    if (qtdMin > 0 || qtdMax > 0) {
      acc[key].metrics.activeSkus.add(row.COD_INTERNO);
    }
    acc[key].metrics.count = acc[key].metrics.activeSkus.size;
    acc[key].metrics.valMaxAtual += parseFloat(row.VALOR_ESTOQUE_MAX_ATUAL) || 0;
    acc[key].metrics.valMaxNovo += (qtdMax * preco);
    acc[key].metrics.mediaVendaMensal += parseFloat(row.MEDIA_VENDA_MENSAL) || 0;
    acc[key].metrics.lucroBruto += parseFloat(row.LUCRO_BRUTO_30D) || 0;
    acc[key].metrics.estoqueCusto += (qtdMax * custo);
    acc[key].metrics.qtdMinNovo += qtdMin;
    acc[key].metrics.qtdMaxNovo += qtdMax;

    acc[key].metrics.perfVendaTotal += parseFloat(row.PERF_VENDA_TOTAL) || 0;
    acc[key].metrics.perfQtdTotal += parseFloat(row.PERF_QTD_TOTAL) || 0;
    acc[key].metrics.perfLucroTotal += parseFloat(row.PERF_LUCRO_TOTAL) || 0;
    
    acc[key].metrics.perfRebaixoValor += parseFloat(row.PERF_REBAIXO_VALOR) || 0;
    acc[key].metrics.perfRebaixoQtd += parseFloat(row.PERF_REBAIXO_QTD) || 0;
    acc[key].metrics.perfRebaixoLucro += parseFloat(row.PERF_REBAIXO_LUCRO) || 0;
    
    acc[key].metrics.perfEncarteValor += parseFloat(row.PERF_ENCARTE_VALOR) || 0;
    acc[key].metrics.perfEncarteQtd += parseFloat(row.PERF_ENCARTE_QTD) || 0;
    acc[key].metrics.perfEncarteLucro += parseFloat(row.PERF_ENCARTE_LUCRO) || 0;
    
    acc[key].metrics.perfTvValor += parseFloat(row.PERF_TV_VALOR) || 0;
    acc[key].metrics.perfTvQtd += parseFloat(row.PERF_TV_QTD) || 0;
    acc[key].metrics.perfTvLucro += parseFloat(row.PERF_TV_LUCRO) || 0;
    
    acc[key].metrics.perfPerdaTotal += parseFloat(row.PERF_PERDA_TOTAL) || 0;

    return acc;
  }, {});

  return Object.values(grouped).map(g => ({
    ...g,
    children: depth < fields.length - 1 ? buildTree(g.rows, fields, depth + 1) : null
  })).sort((a, b) => {
    if (a.field === 'NOME_LOJA' && b.field === 'NOME_LOJA') {
      const idA = a.rows[0]?.EMPRESA || 0;
      const idB = b.rows[0]?.EMPRESA || 0;
      return idA - idB;
    }
    return a.key.toString().localeCompare(b.key.toString());
  });
};

let cachedData = [];
let cachedFields = [];

self.onmessage = (e) => {
  if (e.data.action === 'BUILD') {
    cachedData = e.data.data;
    cachedFields = e.data.drillDownFields;
  }
  
  try {
    const drafts = e.data.draftEdits || {};
    
    // Mapeamos rapidamente os dados originais aplicando os rascunhos ANTES de montar a árvore
    const draftedData = cachedData.map(row => {
      const rowId = `${row.EMPRESA}_${row.COD_INTERNO}`;
      const draft = drafts[rowId];
      
      const newRow = { 
        ...row,
        QTD_MIN_REAL: parseFloat(row.ESTOQUE_MINIMO_ATUAL) || 0,
        QTD_MAX_REAL: parseFloat(row.ESTOQUE_MAXIMO_ATUAL) || 0,
        INATIVO_COMPRA_REAL: row.INATIVO_COMPRA || 'F'
      };

      if (draft) {
        if (draft.inativoCompra !== undefined) newRow.INATIVO_COMPRA_REAL = draft.inativoCompra;
        if (draft.min !== undefined) newRow.QTD_MIN_REAL = draft.min;
        if (draft.max !== undefined) newRow.QTD_MAX_REAL = draft.max;
        if (newRow.INATIVO_COMPRA_REAL === 'T') {
          newRow.QTD_MIN_REAL = 0;
          newRow.QTD_MAX_REAL = 0;
        }
        if (draft.referencia !== undefined) newRow.REFERENCIA = draft.referencia;
        if (draft.modelo !== undefined) newRow.MODELO = draft.modelo;
        if (draft.competitividade !== undefined) newRow.PERC_COMPETITIVIDADE = draft.competitividade;
        if (draft.lucroEncarte !== undefined) newRow.PERC_LUCRO_ENCARTE = draft.lucroEncarte;
        if (draft.lucroTv !== undefined) newRow.PERC_LUCRO_TV = draft.lucroTv;
      }
      return newRow;
    });

    const tree = buildTree(draftedData, cachedFields);
    self.postMessage({ success: true, tree });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
