import React, { useState, useMemo } from 'react';
import { X, Plus, AlertCircle, Activity } from 'lucide-react';

const SimulateProductModal = ({ isOpen, onClose, data, onAddSimulation }) => {
  if (!isOpen) return null;

  // Extract unique hierarchies
  const lojas = useMemo(() => [...new Set(data.map(d => d.EMPRESA))].sort((a, b) => String(a).localeCompare(String(b))), [data]);
  const secoes = useMemo(() => [...new Set(data.map(d => d.DESCRICAO_SECAO))].sort(), [data]);

  const [selectedLojas, setSelectedLojas] = useState([]);
  const [secao, setSecao] = useState('');
  const [grupo, setGrupo] = useState('');
  const [subgrupo, setSubgrupo] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState('');
  const [preco, setPreco] = useState('');
  const [mediaVenda, setMediaVenda] = useState('');
  const [max, setMax] = useState('');

  // Dependent dropdowns
  const grupos = useMemo(() => {
    if (!secao) return [];
    return [...new Set(data.filter(d => d.DESCRICAO_SECAO === secao).map(d => d.DESCRICAO_GRUPO))].sort();
  }, [secao, data]);

  const subgrupos = useMemo(() => {
    if (!grupo) return [];
    return [...new Set(data.filter(d => d.DESCRICAO_GRUPO === grupo).map(d => d.DESCRICAO_SUBGRUPO))].sort();
  }, [grupo, data]);

  const handleLojaToggle = (loja) => {
    setSelectedLojas(prev =>
      prev.includes(loja) ? prev.filter(l => l !== loja) : [...prev, loja]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedLojas.length === 0) {
      alert("Selecione pelo menos uma loja.");
      return;
    }

    setIsSimulating(true);

    // Usa setTimeout para liberar a thread de UI e renderizar o spinner
    setTimeout(() => {
      const fakeId = `SIM-${Date.now()}`;
      const totalMax = parseFloat(max) || 0;
      const totalVenda = parseFloat(mediaVenda) || 0;
      const unitPrice = parseFloat(preco) || 0;
      const unitCost = parseFloat(custo) || 0;

      // Calcular share de venda por loja na categoria (subgrupo)
      const categoryData = data.filter(d =>
        d.DESCRICAO_SECAO === secao &&
        d.DESCRICAO_GRUPO === grupo &&
        d.DESCRICAO_SUBGRUPO === subgrupo
      );

      const lojaSales = {};
      let totalCategorySales = 0;

      // Analisa as vendas da categoria apenas nas lojas selecionadas
      selectedLojas.forEach(loja => {
        const salesForLoja = categoryData
          .filter(d => d.EMPRESA === loja)
          .reduce((acc, d) => acc + (parseFloat(d.MEDIA_VENDA_MENSAL) || 0), 0);
        lojaSales[loja] = salesForLoja;
        totalCategorySales += salesForLoja;
      });

      const newSimulations = selectedLojas.map(loja => {
        let weight = 0;
        if (totalCategorySales > 0) {
          weight = lojaSales[loja] / totalCategorySales;
        } else {
          // Se a rede não tem histórico nesse subgrupo, divide por igual
          weight = 1 / selectedLojas.length;
        }

        const lojaMax = Math.round(totalMax * weight);
        
        let lojaMin = 0;
        if (lojaMax > 0) {
          if (lojaMax <= 2) lojaMin = 1;
          else if (lojaMax <= 3) lojaMin = 2;
          else if (lojaMax <= 5) lojaMin = 3;
          else if (lojaMax <= 8) lojaMin = 4;
          else if (lojaMax <= 12) lojaMin = 7;
          else lojaMin = Math.round(lojaMax * 0.5);
        }
        const lojaVenda = Math.round(totalVenda * weight);

        return {
          EMPRESA: loja,
          NOME_LOJA: loja,
          DESCRICAO_SECAO: secao,
          DESCRICAO_GRUPO: grupo,
          DESCRICAO_SUBGRUPO: subgrupo,
          IDPRODUTO: fakeId,
          COD_INTERNO: fakeId,
          DESCRICAO_PRODUTO: `${descricao} (Simulação)`.toUpperCase(),
          ESTOQUE_MINIMO_ATUAL: 0,
          ESTOQUE_MAXIMO_ATUAL: 0,
          VALOR_ESTOQUE_MAX_ATUAL: 0,
          QTD_MIN_REAL: lojaMin,
          QTD_MAX_REAL: lojaMax,
          MEDIA_VENDA_MENSAL: lojaVenda,
          PRECO_VAREJO: unitPrice,
          CUSTO_GERENC: unitCost,
          VLR_ESTOQUE_CUSTO: lojaMax * unitCost,
          CURVA: 'Simulação',
          COMPRADOR: 'SIMULADOR',
          CLASSIFICACAO: 'SIMULADO',
          INATIVO_COMPRA: 'F',
          INATIVO_COMPRA_REAL: 'F',
          LUCRO_BRUTO_30D: (unitPrice - unitCost) * lojaVenda,
          PAPEL_CATEGORIA: 'Simulação',
          isSimulation: true
        };
      });

      // Disparar o envio para o App (que vai injetar na state global + draftEdits)
      onAddSimulation(newSimulations);
      setIsSimulating(false);
      onClose();
    }, 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form onSubmit={handleSubmit} className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', padding: 0 }}>
        
        <div className="modal-header">
          <h3><Plus size={24} /> Simular Novo Produto</h3>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0', fontSize: '0.9rem' }}>
            <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
            Este produto será inserido artificialmente nos dashboards e tabelas para análise de impacto financeiro. <strong>Ele não será gravado no DB2.</strong>
          </p>

          <details style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.85rem', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 600, color: 'var(--accent-color)', outline: 'none' }}>
              Como funciona o Rateio Inteligente?
            </summary>
            <div style={{ marginTop: '10px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Ao preencher os campos de <strong>Totais da Rede</strong> (Estimativa de Venda, Mínimo e Máximo), o sistema fará a matemática automática antes de injetar o produto:<br /><br />
              1. O sistema varre o histórico de vendas de todas as lojas selecionadas especificamente para a categoria que você escolheu.<br />
              2. Ele descobre a <strong>força de vendas </strong> de cada filial selecionada nesta categoria.<br />
              3. Por fim, <strong>fatia os valores totais</strong> e distribui de forma proporcional, enviando mais estoque para a loja que mais vende e menos para a que menos vende.<br /><br />
              <em>Ex: Se a Loja 1 representa 70% das vendas do Subgrupo e a Loja 3 representa 30%, uma Qtd Máxima de 100 unidades será rateada como 70 para a Loja 1 e 30 para a Loja 3.</em>
            </div>
          </details>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>LOJAS DE DESTINO</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {lojas.map(loja => (
                <label key={loja} style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: selectedLojas.includes(loja) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0,0,0,0.3)',
                  padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <input type="checkbox" checked={selectedLojas.includes(loja)} onChange={() => handleLojaToggle(loja)} />
                  Lj {loja}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>SEÇÃO</label>
              <select className="search-input" value={secao} onChange={e => { setSecao(e.target.value); setGrupo(''); setSubgrupo(''); }} required>
                <option value="">Selecione...</option>
                {secoes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>GRUPO</label>
              <select className="search-input" value={grupo} onChange={e => { setGrupo(e.target.value); setSubgrupo(''); }} required disabled={!secao}>
                <option value="">Selecione...</option>
                {grupos.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>SUBGRUPO</label>
              <select className="search-input" value={subgrupo} onChange={e => setSubgrupo(e.target.value)} required disabled={!grupo}>
                <option value="">Selecione...</option>
                {subgrupos.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>DESCRIÇÃO DO PRODUTO</label>
            <input type="text" className="search-input" value={descricao} onChange={e => setDescricao(e.target.value)} required placeholder="Ex: DETERGENTE LIQUIDO..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CUSTO (R$)</label>
              <input type="number" step="0.01" min="0" className="search-input" value={custo} onChange={e => setCusto(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>PREÇO (R$)</label>
              <input type="number" step="0.01" min="0" className="search-input" value={preco} onChange={e => setPreco(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>TOTAL EST. VENDA (MÊS)</label>
              <input type="number" min="0" className="search-input" value={mediaVenda} onChange={e => setMediaVenda(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '0.5rem', background: 'rgba(56, 189, 248, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>TOTAL QTD MÁXIMA (REDE)</label>
              <input type="number" min="0" className="search-input" value={max} onChange={e => setMax(e.target.value)} required />
            </div>
          </div>

        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '20px', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button type="button" className="close-btn" onClick={onClose} style={{ padding: '10px 20px', fontSize: '0.95rem' }}>Cancelar</button>
          <button type="submit" className="btn-save" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.95rem', background: isSimulating ? 'rgba(56, 189, 248, 0.5)' : undefined, cursor: isSimulating ? 'not-allowed' : 'pointer' }} disabled={isSimulating || !descricao || !secao || selectedLojas.length === 0 || !max || !mediaVenda}>
            {isSimulating ? <Activity size={18} className="spin" /> : <Plus size={18} />}
            {isSimulating ? 'Calculando Share...' : 'Simular Produto'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SimulateProductModal;
