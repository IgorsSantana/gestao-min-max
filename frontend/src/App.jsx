import React, { useState, useEffect, useMemo, useDeferredValue, Suspense, lazy } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { RefreshCw, AlertTriangle, TrendingUp, Activity, Save, PieChart, Info, X, Clock, Menu, Filter, Search, Sparkles } from 'lucide-react';
import SidebarFilters from './components/SidebarFilters';
import PivotTable from './components/PivotTable';
const SimulateProductModal = lazy(() => import('./components/SimulateProductModal'));
const AuditHistoryModal = lazy(() => import('./components/AuditHistoryModal'));
const WhatsNewModal = lazy(() => import('./components/WhatsNewModal'));
const DocsModal = lazy(() => import('./components/DocsModal'));
import { LojaBarChart, CurvaBarChart, CapitalScatterChart } from './components/Charts';
import './App.css';
import logoImg from './assets/Logo.png';

// Hook customizado para atraso inteligente (Debounce)
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const baseUrl = `http://${window.location.hostname}:8900`;
      const response = await axios.post(`${baseUrl}/api/login`, { username, password });
      if (response.data.success) {
        onLogin(response.data.username);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div className="glass-panel" style={{ padding: '3rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h2>Login Min/Max</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Identifique-se para acessar o sistema.</p>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontSize: '0.9rem' }}>{error}</div>}

        <input 
          type="text" 
          placeholder="Nome de Usuário" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
          onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('pwdInput').focus(); }}
        />
        <input 
          id="pwdInput"
          type="password" 
          placeholder="Senha" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '1.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
        />
        <button 
          className="btn-save" 
          onClick={handleLogin} 
          disabled={!username || !password || loading}
          style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
        >
          {loading ? 'Autenticando...' : 'Entrar'}
        </button>

        <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'left', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
          <strong>Contas de teste:</strong><br/>
          👤 admin | 🔑 admin123<br/>
          👤 comprador | 🔑 123456
        </div>
      </div>
    </div>
  );
}

function App() {
  const [loggedUser, setLoggedUser] = useState(() => localStorage.getItem('minMaxUser') || '');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // States para colunas da PivotTable
  const [showProfitCols, setShowProfitCols] = useState(false);
  const [showPerf90dCols, setShowPerf90dCols] = useState(false);
  
  // State para filtros dinâmicos
  const [filters, setFilters] = useState({
    NOME_LOJA: [],
    CURVA: [],
    COMPRADOR: [],
    DESCRICAO_SECAO: [],
    DESCRICAO_GRUPO: [],
    DESCRICAO_SUBGRUPO: [],
    REFERENCIA: [],
    MODELO: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [specialFilters, setSpecialFilters] = useState({
    atencao: false,
    zerados: false,
    inativosCompra: false,
    ativosCompra: false
  });

  const deferredFilters = useDeferredValue(filters);
  const deferredSpecialFilters = useDeferredValue(specialFilters);

  const [activeGlossary, setActiveGlossary] = useState(null);

  // State para o Modal de Auditoria
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // State para o Modal de Confirmação de Gravação
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);

  // State para abrir o modal de simulação
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // State para guardar alterações do usuário na tabela antes de enviar ao Banco
  const [draftEdits, setDraftEdits] = useState({});

  // Produtos virtuais criados para simulação
  const [simulatedProducts, setSimulatedProducts] = useState([]);

  // Novidades e Docs
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  
  // State para a lista de modelos vindos do DB
  const [modelosList, setModelosList] = useState([]);

  const fetchData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = `http://${window.location.hostname}:8900`;
      const url = `${baseUrl}/api/estoque${force ? '?force=true' : ''}`;
      
      const [response, resModelos, resPerf] = await Promise.all([
        axios.get(url),
        axios.get(`${baseUrl}/api/modelos`),
        axios.get(`${baseUrl}/api/performance`)
      ]);

      setModelosList(resModelos.data);

      const perfSales = resPerf.data.sales || [];
      const perfTotalSales = resPerf.data.totalSales || [];
      const perfLosses = resPerf.data.losses || [];

      // Mapeamento dos dados de performance 90d
      const perfMap = {}; // KEY: EMPRESA_CODINTERNO

      perfTotalSales.forEach(ts => {
        const key = `${ts.EMPRESA}_${ts.COD_INTERNO}`;
        perfMap[key] = {
          vendaTotal: parseFloat(ts.SUM_VALTOTLIQUIDO_TT) || 0,
          qtdTotal: parseFloat(ts.SUM_QTDPRODUTO_TT) || 0,
          lucroTotal: parseFloat(ts.SUM_VALLUCRO_TT) || 0,
          promoRebaixoTotal: 0, promoRebaixoQtd: 0, promoRebaixoLucro: 0,
          promoEncarteTotal: 0, promoEncarteQtd: 0, promoEncarteLucro: 0,
          promoTvTotal: 0, promoTvQtd: 0, promoTvLucro: 0,
          perdaTotal: 0
        };
      });

      perfSales.forEach(s => {
        const key = `${s.EMPRESA}_${s.COD_INTERNO}`;
        if (!perfMap[key]) {
          perfMap[key] = {
            vendaTotal: 0, qtdTotal: 0, lucroTotal: 0,
            promoRebaixoTotal: 0, promoRebaixoQtd: 0, promoRebaixoLucro: 0,
            promoEncarteTotal: 0, promoEncarteQtd: 0, promoEncarteLucro: 0,
            promoTvTotal: 0, promoTvQtd: 0, promoTvLucro: 0,
            perdaTotal: 0
          };
        }

        const val = parseFloat(s.SUM_VALTOTLIQUIDO) || 0;
        const qtd = parseFloat(s.SUM_QTDPRODUTO) || 0;
        const lucro = parseFloat(s.SUM_VALLUCRO) || 0;
        const tp = parseInt(s.IDTPPROMOCAO);

        if (tp === 21) {
          perfMap[key].promoRebaixoTotal += val;
          perfMap[key].promoRebaixoQtd += qtd;
          perfMap[key].promoRebaixoLucro += lucro;
        } else if ([12, 13, 14].includes(tp)) {
          perfMap[key].promoEncarteTotal += val;
          perfMap[key].promoEncarteQtd += qtd;
          perfMap[key].promoEncarteLucro += lucro;
        } else if (tp !== 16 && tp !== null && !isNaN(tp)) {
          perfMap[key].promoTvTotal += val;
          perfMap[key].promoTvQtd += qtd;
          perfMap[key].promoTvLucro += lucro;
        }
      });

      perfLosses.forEach(l => {
        const key = `${l.EMPRESA}_${l.COD_INTERNO}`;
        if (!perfMap[key]) {
          perfMap[key] = {
            vendaTotal: 0, qtdTotal: 0, lucroTotal: 0,
            promoRebaixoTotal: 0, promoRebaixoQtd: 0, promoRebaixoLucro: 0,
            promoEncarteTotal: 0, promoEncarteQtd: 0, promoEncarteLucro: 0,
            promoTvTotal: 0, promoTvQtd: 0, promoTvLucro: 0,
            perdaTotal: 0
          };
        }
        perfMap[key].perdaTotal += (parseFloat(l.SUM_VALPERDA) || 0);
      });

      // Filtro agressivo de Frontend (Garantia dupla anti-cache/case-sensitive)
      const cleanData = response.data.map(item => {
        const LOJAS_MAP = {
          1: 'BCS',
          3: 'SJN',
          4: 'MEP',
          5: 'FCL1',
          6: 'FCL2',
          7: 'FCL3',
          8: 'FCL4'
        };

        const key = `${item.EMPRESA}_${item.COD_INTERNO}`;
        const perf = perfMap[key] || {};

        return {
          ...item,
          NOME_LOJA: LOJAS_MAP[item.EMPRESA] || String(item.EMPRESA),
          INATIVO_COMPRA: item.INATIVO_COMPRA ? String(item.INATIVO_COMPRA).trim() : 'F',
          COMPRADOR: item.COMPRADOR ? String(item.COMPRADOR).trim() : 'NÃO INFORMADO',
          CURVA: item.CURVA ? String(item.CURVA).trim() : 'OUTROS',
          DESCRICAO_PRODUTO: `${item.COD_INTERNO || ''} - ${item.DESCRICAO_PRODUTO || ''}`.trim(),
          
          PERF_VENDA_TOTAL: perf.vendaTotal || 0,
          PERF_QTD_TOTAL: perf.qtdTotal || 0,
          PERF_LUCRO_TOTAL: perf.lucroTotal || 0,
          
          PERF_REBAIXO_VALOR: perf.promoRebaixoTotal || 0,
          PERF_REBAIXO_QTD: perf.promoRebaixoQtd || 0,
          PERF_REBAIXO_LUCRO: perf.promoRebaixoLucro || 0,
          
          PERF_ENCARTE_VALOR: perf.promoEncarteTotal || 0,
          PERF_ENCARTE_QTD: perf.promoEncarteQtd || 0,
          PERF_ENCARTE_LUCRO: perf.promoEncarteLucro || 0,
          
          PERF_TV_VALOR: perf.promoTvTotal || 0,
          PERF_TV_QTD: perf.promoTvQtd || 0,
          PERF_TV_LUCRO: perf.promoTvLucro || 0,
          
          PERF_PERDA_TOTAL: perf.perdaTotal || 0
        };
      });

      setData(cleanData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Falha ao carregar os dados. Verifique se o servidor backend está rodando na porta 3001.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allData = useMemo(() => {
    return [...data, ...simulatedProducts];
  }, [data, simulatedProducts]);

  // Aplica filtros e busca textual aos dados brutos
  const filteredData = useMemo(() => {
    const query = (debouncedSearchQuery || '').toLowerCase();

    return allData.filter(row => {
      // Filtro de Busca Textual
      if (query) {
        const produto = String(row.DESCRICAO_PRODUTO || '').toLowerCase();
        const ean = String(row.COD_EAN || '').toLowerCase();
        const cod = String(row.COD_INTERNO || '').toLowerCase();
        if (!produto.includes(query) && !ean.includes(query) && !cod.includes(query)) {
          return false;
        }
      }

      // Filtros Especiais Rápidos
      if (deferredSpecialFilters.atencao || deferredSpecialFilters.zerados || deferredSpecialFilters.inativosCompra || deferredSpecialFilters.ativosCompra) {
        // Usa o VALOR financeiro atual do banco para o cálculo bater com a tabela
        const maxValor = parseFloat(row.VALOR_ESTOQUE_MAX_ATUAL) || 0;
        const maxQtd = parseFloat(row.ESTOQUE_MAXIMO_ATUAL) || 0;
        const mediaVenda = parseFloat(row.MEDIA_VENDA_MENSAL) || 0;
        const cobertura = mediaVenda > 0 ? (maxValor / mediaVenda) * 30 : 0;
        const inativo = String(row.INATIVO_COMPRA).trim() === 'T';

        if (deferredSpecialFilters.atencao && (cobertura >= 10 && cobertura <= 60)) {
          return false; // Se quer os de atenção, exclui os que estão no verde/amarelo saudável
        }

        if (deferredSpecialFilters.zerados && maxQtd > 0) {
          return false; // Se quer os zerados, exclui os que tem mais de 0 unidades
        }

        if (deferredSpecialFilters.inativosCompra && !inativo) {
          return false; // Se quer os inativos, exclui os que NÃO são inativos
        }

        if (deferredSpecialFilters.ativosCompra && inativo) {
          return false; // Se quer os ativos, exclui os que SÃO inativos
        }
      }

      // Filtro de Categorias (Lojas, Curva, etc)
      for (const [key, selected] of Object.entries(deferredFilters)) {
        if (selected.length > 0 && !selected.some(val => String(val) === String(row[key]))) {
          return false;
        }
      }
      return true;
    });
  }, [allData, deferredFilters, debouncedSearchQuery, deferredSpecialFilters]);

  // Função para interceptar o clique num gráfico e filtrar
  const handleChartClick = (filterType, value) => {
    if (!value) return;
    setFilters(prev => ({
      ...prev,
      [filterType]: [String(value)] // Sobrescreve com o item clicado
    }));
  };

  // Função para salvar a digitação do usuário (min e max) no estado temporário
  const handleEditChange = (empresa, codInterno, field, value, idProduto) => {
    setDraftEdits(prev => {
      const newState = { ...prev };

      // Se for alteração do flag de inativo, referência, modelo, ou percentuais de lucro, deve refletir em TODAS as empresas daquele produto
      if (['inativoCompra', 'referencia', 'modelo', 'competitividade', 'lucroEncarte', 'lucroTv'].includes(field)) {
        const allStores = allData.filter(r => r.IDPRODUTO === idProduto && r.COD_INTERNO === codInterno);

        allStores.forEach(store => {
          const sRowId = `${store.EMPRESA}_${codInterno}`;
          const currentDraft = newState[sRowId] || {};

          newState[sRowId] = {
            ...currentDraft,
            idEmpresa: store.EMPRESA,
            idProduto: idProduto,
            idSubProduto: codInterno,
            [field]: value
          };

          if (field === 'inativoCompra' && value === 'T') {
            newState[sRowId].min = 0;
            newState[sRowId].max = 0;
          }
        });
      } else {
        // Alteração normal de min/max afeta apenas a filial específica
        const rowId = `${empresa}_${codInterno}`;
        const currentDraft = newState[rowId] || {};

        const parsedValue = value === '' ? 0 : parseFloat(value);
        newState[rowId] = {
          ...currentDraft,
          idEmpresa: empresa,
          idProduto: idProduto,
          idSubProduto: codInterno,
          [field]: parsedValue
        };

        if (field === 'max') {
          let minFinal = 0;
          const maxFinal = parsedValue;
          if (maxFinal > 0) {
            if (maxFinal <= 2) minFinal = 1;
            else if (maxFinal <= 3) minFinal = 2;
            else if (maxFinal <= 5) minFinal = 3;
            else if (maxFinal <= 8) minFinal = 4;
            else if (maxFinal <= 12) minFinal = 7;
            else minFinal = Math.round(maxFinal * 0.5);
          }
          newState[rowId].min = minFinal;
        }
      }

      return newState;
    });
  };

  const handleAddSimulation = (newProducts) => {
    setSimulatedProducts(prev => [...prev, ...newProducts]);

    // Injeta imediatamente as sugestões de min/max no rascunho 
    // para que a tabela e as fórmulas do dashboard já o contabilizem
    setDraftEdits(prev => {
      const newState = { ...prev };
      newProducts.forEach(prod => {
        const rowId = `${prod.EMPRESA}_${prod.COD_INTERNO}`;
        newState[rowId] = {
          idEmpresa: prod.EMPRESA,
          idProduto: prod.IDPRODUTO,
          idSubProduto: prod.COD_INTERNO,
          min: prod.QTD_MIN_REAL,
          max: prod.QTD_MAX_REAL,
          inativoCompra: 'F'
        };
      });
      return newState;
    });
  };

  const [saving, setSaving] = useState(false);

  const saveDraftsToDB = async () => {
    setSaving(true);
    try {
      const auditLogs = [];
      const updates = Object.values(draftEdits)
        .filter(draft => !String(draft.idSubProduto).startsWith('SIM-'))
        .map(draft => {
          // Encontra o dado original para mandar o que não foi modificado (caso editou só o max, manda o min original)
          const rowId = `${draft.idEmpresa}_${draft.idSubProduto}`;
          const originalRow = data.find(r => r.EMPRESA === draft.idEmpresa && r.COD_INTERNO === draft.idSubProduto);
          
          if (originalRow) {
            const minAntigo = parseFloat(originalRow.ESTOQUE_MINIMO_ATUAL);
            const maxAntigo = parseFloat(originalRow.ESTOQUE_MAXIMO_ATUAL);
            if (draft.min !== undefined && draft.min !== minAntigo) {
              auditLogs.push({ idEmpresa: draft.idEmpresa, idProduto: draft.idProduto, idSubProduto: draft.idSubProduto, campo: 'ESTOQUE_MINIMO', valorAntigo: minAntigo, valorNovo: draft.min, usuario: loggedUser });
            }
            if (draft.max !== undefined && draft.max !== maxAntigo) {
              auditLogs.push({ idEmpresa: draft.idEmpresa, idProduto: draft.idProduto, idSubProduto: draft.idSubProduto, campo: 'ESTOQUE_MAXIMO', valorAntigo: maxAntigo, valorNovo: draft.max, usuario: loggedUser });
            }
            if (draft.inativoCompra !== undefined && draft.inativoCompra !== originalRow.INATIVO_COMPRA) {
              auditLogs.push({ idEmpresa: draft.idEmpresa, idProduto: draft.idProduto, idSubProduto: draft.idSubProduto, campo: 'INATIVO_COMPRA', valorAntigo: originalRow.INATIVO_COMPRA || 'F', valorNovo: draft.inativoCompra, usuario: loggedUser });
            }
            if (draft.referencia !== undefined && draft.referencia !== (originalRow.REFERENCIA || '')) {
              auditLogs.push({ idEmpresa: draft.idEmpresa, idProduto: draft.idProduto, idSubProduto: draft.idSubProduto, campo: 'REFERENCIA', valorAntigo: originalRow.REFERENCIA || '', valorNovo: draft.referencia, usuario: loggedUser });
            }
            if (draft.modelo !== undefined && draft.modelo !== (originalRow.MODELO || '')) {
              auditLogs.push({ idEmpresa: draft.idEmpresa, idProduto: draft.idProduto, idSubProduto: draft.idSubProduto, campo: 'MODELO', valorAntigo: originalRow.MODELO || '', valorNovo: draft.modelo, usuario: loggedUser });
            }
            if (draft.competitividade !== undefined && draft.competitividade !== parseFloat(originalRow.PERC_COMPETITIVIDADE || 0)) {
              auditLogs.push({ idEmpresa: draft.idEmpresa, idProduto: draft.idProduto, idSubProduto: draft.idSubProduto, campo: '% COMPETITIVIDADE', valorAntigo: parseFloat(originalRow.PERC_COMPETITIVIDADE || 0), valorNovo: draft.competitividade, usuario: loggedUser });
            }
            if (draft.lucroEncarte !== undefined && draft.lucroEncarte !== parseFloat(originalRow.PERC_LUCRO_ENCARTE || 0)) {
              auditLogs.push({ idEmpresa: draft.idEmpresa, idProduto: draft.idProduto, idSubProduto: draft.idSubProduto, campo: '% LUCRO ENCARTE', valorAntigo: parseFloat(originalRow.PERC_LUCRO_ENCARTE || 0), valorNovo: draft.lucroEncarte, usuario: loggedUser });
            }
            if (draft.lucroTv !== undefined && draft.lucroTv !== parseFloat(originalRow.PERC_LUCRO_TV || 0)) {
              auditLogs.push({ idEmpresa: draft.idEmpresa, idProduto: draft.idProduto, idSubProduto: draft.idSubProduto, campo: '% LUCRO TV', valorAntigo: parseFloat(originalRow.PERC_LUCRO_TV || 0), valorNovo: draft.lucroTv, usuario: loggedUser });
            }
          }

          return {
            IDEMPRESA: draft.idEmpresa,
            IDPRODUTO: draft.idProduto,
            IDSUBPRODUTO: draft.idSubProduto,
            QTDESTMINIMO: draft.min !== undefined ? draft.min : (originalRow ? parseFloat(originalRow.ESTOQUE_MINIMO_ATUAL) : 0),
            QTDESTMAXIMO: draft.max !== undefined ? draft.max : (originalRow ? parseFloat(originalRow.ESTOQUE_MAXIMO_ATUAL) : 0),
            INATIVO_COMPRA: draft.inativoCompra !== undefined ? draft.inativoCompra : undefined,
            REFERENCIA: draft.referencia !== undefined ? draft.referencia : undefined,
            MODELO: draft.modelo !== undefined ? draft.modelo : undefined,
            PERC_COMPETITIVIDADE: draft.competitividade !== undefined ? draft.competitividade : undefined,
            PERC_LUCRO_ENCARTE: draft.lucroEncarte !== undefined ? draft.lucroEncarte : undefined,
            PERC_LUCRO_TV: draft.lucroTv !== undefined ? draft.lucroTv : undefined
          };
        });

      if (updates.length === 0) {
        toast('Nenhuma alteração em produtos reais para salvar no ERP.', { icon: 'ℹ️' });
        setIsConfirmingSave(false);
        setSaving(false);
        return;
      }

      const baseUrl = `http://${window.location.hostname}:8900`;
      await axios.post(`${baseUrl}/api/estoque/limites`, { updates, auditLogs });
      toast.success(`Sucesso! ${updates.length} produto(s) atualizado(s) no ERP.`);
      setDraftEdits({}); // Limpa os rascunhos
      fetchData(true); // Recarrega os dados do banco forçando bypass do cache
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar no banco de dados corporativo.');
    } finally {
      setSaving(false);
    }
  };

  // Otimização: Uso de Deltas para não iterar em milhares de itens a cada digitação!
  const { baseTotais, mapFilteredData } = useMemo(() => {
    let totalMax = 0;
    let totalMedia = 0;
    const lojasData = {};
    const map = new Map();

    filteredData.forEach(item => {
      const rowId = `${item.EMPRESA}_${item.COD_INTERNO}`;
      map.set(rowId, item);
      
      const atual = parseFloat(item.VALOR_ESTOQUE_MAX_ATUAL) || 0;
      totalMax += atual;

      const mediaVenda = parseFloat(item.MEDIA_VENDA_MENSAL) || 0;
      totalMedia += mediaVenda;

      const loja = item.NOME_LOJA;
      if (!lojasData[loja]) lojasData[loja] = { maxEstoque: 0, mediaVenda: 0 };
      lojasData[loja].maxEstoque += atual;
      lojasData[loja].mediaVenda += mediaVenda;
    });

    return { baseTotais: { totalMax, totalMedia, lojasData }, mapFilteredData: map };
  }, [filteredData]);

  const totaisCalculados = useMemo(() => {
    let totalMax = baseTotais.totalMax;
    let capLib = 0;
    let totalMedia = baseTotais.totalMedia;
    
    // Clona o lojasData para mutação segura sem afetar os dados base
    const lojasData = {};
    for (const l in baseTotais.lojasData) {
      lojasData[l] = { ...baseTotais.lojasData[l] };
    }

    // Calcula os deltas varrendo APENAS os itens editados (draftEdits)
    Object.keys(draftEdits).forEach(rowId => {
      const draft = draftEdits[rowId];
      const item = mapFilteredData.get(rowId);
      if (!item) return; // Ignora se o item editado não está na busca atual
      
      const preco = parseFloat(item.PRECO_VAREJO) || 0;
      const atual = parseFloat(item.VALOR_ESTOQUE_MAX_ATUAL) || 0;
      
      let novo = atual;
      if (draft.max !== undefined) {
        novo = draft.max * preco;
      } else if (draft.inativoCompra === 'T') {
        novo = 0;
      }

      const diffTotal = novo - atual;
      
      totalMax += diffTotal;
      
      if (diffTotal < 0) capLib += Math.abs(diffTotal);

      const loja = item.NOME_LOJA;
      if (lojasData[loja]) {
        lojasData[loja].maxEstoque += diffTotal;
      }
    });

    const coberturaGeral = totalMedia > 0 ? (totalMax / totalMedia) * 30 : 0;
    const percCoberturaGeral = totalMedia > 0 ? (totalMax / totalMedia) * 100 : 0;

    const coberturaPorLojaArr = Object.keys(lojasData).map(loja => {
      const { maxEstoque, mediaVenda } = lojasData[loja];
      const cobertura = mediaVenda > 0 ? (maxEstoque / mediaVenda) * 30 : 0;
      return { loja, cobertura };
    }).sort((a, b) => String(a.loja).localeCompare(String(b.loja)));

    return { totalMax, capLib, totalMedia, coberturaGeral, percCoberturaGeral, coberturaPorLoja: coberturaPorLojaArr };
  }, [baseTotais, mapFilteredData, draftEdits]);

  const { totalMaxEstoque: totalMax, capitalLiberado: capLib, coberturaGeral, percCoberturaGeral, coberturaPorLoja } = totaisCalculados;
  const totalMaxEstoque = totaisCalculados.totalMax;
  const capitalLiberado = totaisCalculados.capLib;

  const hasDrafts = Object.keys(draftEdits).length > 0;

  const renderGlossaryModal = () => {
    if (!activeGlossary) return null;

    const content = {
      capital: {
        title: "Capital Liberado (Dinheiro Descongelado)",
        body: (
          <>
            <p><strong>O que é?</strong> É o dinheiro puro que a empresa deixou de imobilizar ao otimizar (reduzir) limites irreais de compra.</p>
            <p><strong>Como a sua Simulação afeta isso?</strong> Se o aplicativo detecta que um produto (ex: Feijão) tinha uma QTD MÁX no banco de 100 fardos (custo de R$ 10.000), e você simula uma nova QTD MÁX de 60 fardos (custo de R$ 6.000), você cortou o teto do estoque.</p>
            <p>Essa diferença brutal de <strong>R$ 4.000</strong> vira Capital Liberado. O app soma isso globalmente para você ver o impacto trilionário de apenas alguns cliques otimizando aquilo que não gira.</p>
          </>
        )
      },
      estoque_max: {
        title: "Total Estoque Máx (Teto Financeiro)",
        body: (
          <>
            <p><strong>O que é?</strong> Representa a bolada de dinheiro que você teria parado no depósito se atingisse 100% da capacidade do produto.</p>
            <p><strong>Como é calculado?</strong> Quantidade Máxima Permitida multiplicada pelo Valor do Produto.</p>
            <p><strong>Por que importa?</strong> Ver no sistema que o limite máximo de um detergente é "500 unidades" não chama a atenção. Mas ver que a categoria de Limpeza tem um "Teto Máximo" de R$ 250.000,00 parados choca qualquer gestor financeiro.</p>
          </>
        )
      },
      lucro_varejo: {
        title: "Margem de Lucro Bruto (% Lucro Varejo)",
        body: (
          <>
            <p><strong>O que é?</strong> A rentabilidade ou margem bruta projetada com base no preço de venda e no custo gerencial.</p>
            <p><strong>Como é calculado?</strong> Diferença entre o Preço de Varejo e o Custo, dividida pelo Preço de Varejo, em forma de porcentagem.</p>
            <p><strong>Por que importa?</strong> Ter um Teto Máximo alto de estoque em categorias que te dão margem negativa ou muito baixa é congelar dinheiro ruim. Margens positivas (em verde) indicam categorias saudáveis para investir; margens negativas (em vermelho) indicam que há um problema de preço ou custo.</p>
          </>
        )
      },
      cobertura: {
        title: "Dias de Cobertura (Autonomia)",
        body: (
          <>
            <p><strong>O que é?</strong> A Autonomia do Estoque. Se o mundo parasse e ninguém mais fizesse pedidos, por quantos dias você conseguiria vender esse produto?</p>
            <p><strong>Como é calculado?</strong> QTD MÁX do estoque dividida pela Velocidade de Vendas Média Diária do produto.</p>

            <h4 style={{ color: 'var(--accent-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>O que cada cor significa:</h4>
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              <li style={{ marginBottom: '10px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', marginRight: '8px' }}></span>
                <strong>Abaixo de 10 dias (Vermelho):</strong> Risco severo de ruptura! Vai faltar produto na gôndola se houver qualquer atraso logístico.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '8px' }}></span>
                <strong>Entre 10 e 35 dias (Verde):</strong> Saudável. Estoque girando rápido e mantendo o fluxo de caixa excelente.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '8px' }}></span>
                <strong>Entre 36 e 60 dias (Amarelo):</strong> Alerta de excesso. Começando a acumular mercadoria na prateleira.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', marginRight: '8px' }}></span>
                <strong>Acima de 60 dias (Vermelho):</strong> Dinheiro empacado! Alto nível de superestocagem. Reduza a QTD MÁX imediatamente.
              </li>
            </ul>
          </>
        )
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setActiveGlossary(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3><Info size={24} /> {content[activeGlossary].title}</h3>
            <button className="close-btn" onClick={() => setActiveGlossary(null)}><X size={20} /></button>
          </div>
          <div className="modal-body">
            {content[activeGlossary].body}
          </div>
          <div className="modal-footer">
            <button className="btn-save" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', boxShadow: 'none' }} onClick={() => setActiveGlossary(null)}>Entendi</button>
          </div>
        </div>
      </div>
    );
  };

  const renderSaveConfirmationModal = () => {
    if (!isConfirmingSave) return null;

    const groupedDrafts = {};
    Object.values(draftEdits).forEach(draft => {
      const key = `${draft.idProduto}_${draft.idSubProduto}`;
      if (!groupedDrafts[key]) {
        groupedDrafts[key] = {
          idProduto: draft.idProduto,
          idSubProduto: draft.idSubProduto,
          descricao: '',
          originalInativo: 'F',
          newInativo: null,
          originalRef: null,
          newRef: null,
          originalModelo: null,
          newModelo: null,
          stores: []
        };
      }

      const originalRow = allData.find(r => r.EMPRESA === draft.idEmpresa && r.COD_INTERNO === draft.idSubProduto);
      if (originalRow && !groupedDrafts[key].descricao) {
        groupedDrafts[key].descricao = originalRow.DESCRICAO_PRODUTO;
        groupedDrafts[key].originalInativo = originalRow.INATIVO_COMPRA;
        groupedDrafts[key].originalRef = originalRow.REFERENCIA || '-';
        groupedDrafts[key].originalModelo = originalRow.MODELO || '-';
      }

      const originalMin = originalRow ? parseFloat(originalRow.ESTOQUE_MINIMO_ATUAL) : 0;
      const originalMax = originalRow ? parseFloat(originalRow.ESTOQUE_MAXIMO_ATUAL) : 0;
      const newMin = draft.min !== undefined ? draft.min : originalMin;
      const newMax = draft.max !== undefined ? draft.max : originalMax;

      if (draft.inativoCompra !== undefined) {
        groupedDrafts[key].newInativo = draft.inativoCompra;
      }
      if (draft.referencia !== undefined) {
        groupedDrafts[key].newRef = draft.referencia;
      }
      if (draft.modelo !== undefined) {
        groupedDrafts[key].newModelo = draft.modelo;
      }

      groupedDrafts[key].stores.push({
        idEmpresa: draft.idEmpresa,
        originalMin,
        originalMax,
        newMin,
        newMax
      });
    });

    const changesList = Object.values(groupedDrafts).map(group => {
      const newInativo = group.newInativo !== null ? group.newInativo : group.originalInativo;
      const newRef = group.newRef !== null ? group.newRef : group.originalRef;
      const newModelo = group.newModelo !== null ? group.newModelo : group.originalModelo;
      const inativoChanged = group.originalInativo !== newInativo;
      const refChanged = group.originalRef !== newRef;
      const modeloChanged = group.originalModelo !== newModelo;

      return (
        <div key={`${group.idProduto}_${group.idSubProduto}`} className="confirm-list-item" style={{ marginBottom: '1rem', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-color)', marginBottom: '8px', fontSize: '1.1rem' }}>
            {group.descricao || `Produto ${group.idSubProduto}`}
          </div>

          {inativoChanged && (
            <div style={{ marginBottom: '8px', padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <strong>Inativo p/ Compra global:</strong> <span className="change-value" style={{ color: newInativo === 'T' ? '#ef4444' : '#10b981', marginLeft: '4px' }}>{newInativo === 'T' ? 'SIM' : 'NÃO'}</span>
            </div>
          )}
          {refChanged && (
            <div style={{ marginBottom: '8px', padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <strong>Referência:</strong> <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{group.originalRef}</span> ➔ <span style={{ color: '#10b981' }}>{newRef || '-'}</span>
            </div>
          )}
          {modeloChanged && (
            <div style={{ marginBottom: '8px', padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <strong>Modelo:</strong> <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{group.originalModelo}</span> ➔ <span style={{ color: '#10b981' }}>{newModelo || '-'}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {group.stores.map(store => {
              const minChanged = store.originalMin !== store.newMin;
              const maxChanged = store.originalMax !== store.newMax;

              if (!minChanged && !maxChanged) return null;

              return (
                <div key={store.idEmpresa} style={{ borderLeft: '3px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loja {store.idEmpresa}</div>
                  <div className="confirm-changes" style={{ fontSize: '0.9rem', display: 'flex', gap: '10px' }}>
                    {minChanged && (
                      <div>Mín: <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{store.originalMin}</span> ➔ <span style={{ color: '#10b981' }}>{store.newMin}</span></div>
                    )}
                    {maxChanged && (
                      <div>Máx: <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{store.originalMax}</span> ➔ <span style={{ color: '#10b981' }}>{store.newMax}</span></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });

    return (
      <div className="modal-overlay" onClick={() => setIsConfirmingSave(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%' }}>
          <div className="modal-header">
            <h3 style={{ color: '#f59e0b' }}>
              <AlertTriangle size={24} /> Confirmação de Gravação (DB2)
            </h3>
            <button className="close-btn" onClick={() => setIsConfirmingSave(false)}><X size={20} /></button>
          </div>

          <div className="modal-body">
            <p>
              Você está prestes a alterar limites de <strong>{Object.keys(draftEdits).length}</strong> produto(s) no banco de dados corporativo. Por favor, revise as alterações na lista abaixo:
            </p>

            <div className="confirm-list-container">
              {changesList}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-save" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', boxShadow: 'none' }} onClick={() => setIsConfirmingSave(false)} disabled={saving}>
              Cancelar e Revisar
            </button>
            <button className="btn-save" onClick={() => {
              saveDraftsToDB();
              setIsConfirmingSave(false);
            }} disabled={saving}>
              {saving ? (
                <><RefreshCw size={18} className="spin" /> Salvando no DB2...</>
              ) : (
                <><Save size={18} /> Confirmar Gravação Lote</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!loggedUser) {
    return <LoginScreen onLogin={(user) => {
      setLoggedUser(user);
      localStorage.setItem('minMaxUser', user);
    }} />;
  }

  return (
    <div className="dashboard-layout" style={{ flexDirection: 'column' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      {/* Header Superior */}
      <header className="dashboard-header glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 50 }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Gestão Min/Max
            <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>v2.5.0</span>
          </h2>
          
          <div className="header-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Pesquisar Produto, Cód, EAN..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'white', fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {loggedUser === 'admin' && (
            <button
              onClick={() => setShowDocs(true)}
              className="btn-action animate-fade-in"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'}}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'}}
            >
              Documentação
            </button>
          )}
          <button
              onClick={() => setShowWhatsNew(true)}
              className="btn-action animate-fade-in"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
                color: 'white',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Sparkles size={16} />
              Novidades
            </button>
          <button className="btn-save" onClick={() => setIsFilterModalOpen(true)} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '8px 15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={16} /> Filtros Avançados
          </button>
          
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }}></div>

          <button className="btn-refresh-sm" onClick={() => fetchData(true)} disabled={loading} title="Forçar Leitura do DB2 (Ignora Cache)">
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn-refresh-sm" onClick={() => setIsSimulateModalOpen(true)} title="Simular Novo Produto">
            <Activity size={18} />
          </button>
          <button className="btn-refresh-sm" onClick={() => setIsAuditModalOpen(true)} title="Histórico de Alterações">
            <Clock size={18} />
          </button>
          
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{loggedUser}</span>
            <button className="btn-refresh-sm" onClick={() => {
              setLoggedUser('');
              localStorage.removeItem('minMaxUser');
            }} title="Sair" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
              <X size={16} color="#ef4444" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Tabelas */}
      <div className="dashboard-main" style={{ padding: '15px' }}>
        {loading ? (
          <div className="loading-state main-loader" style={{ flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <img src={logoImg} alt="CISS Logo" className="loader-logo" />
            <p className="loader-text">Conectando ao Data Warehouse DB2...</p>
          </div>
        ) : error ? (
          <div className="error-state main-loader">
            <AlertTriangle className="large-icon danger" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="dashboard-cards">
              <div className="card glass-panel">
                <div className="card-icon success"><TrendingUp size={20} /></div>
                <div className="card-info">
                  <h3>Valor Máx. Varejo (Novo)</h3>
                  <p className="card-value">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalMaxEstoque)}
                  </p>
                </div>
              </div>
              <div className="card glass-panel" style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}>
                <div className="card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <AlertTriangle size={20} />
                </div>
                <div className="card-info">
                  <h3>Capital Liberado</h3>
                  <p className="card-value" style={{ color: '#ef4444' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(capitalLiberado)}
                  </p>
                </div>
              </div>

              <div className="card glass-panel" style={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}>
                <div className="card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                  <Activity size={20} />
                </div>
                <div className="card-info" style={{ flex: 1 }}>
                  <h3 title="Dias de cobertura para o estoque geral simulado">Cobertura Global</h3>
                  <p className="card-value" style={{ color: '#3b82f6', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    {Math.round(coberturaGeral)} dias
                    <span style={{ fontSize: '1rem', fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>
                      ({Math.round(percCoberturaGeral)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.5rem 1rem', marginBottom: '1rem', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>COBERTURA POR LOJA:</span>
              {coberturaPorLoja.map(l => (
                <span key={l.loja} style={{
                  fontSize: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {l.loja}: <strong style={{ color: '#7dd3fc' }}>{Math.round(l.cobertura)}d</strong>
                </span>
              ))}
            </div>

            {/* Legendas e Controles */}
            <div className="tabs-container" style={{ justifyContent: 'space-between', borderBottom: 'none', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-action"
                  onClick={() => setShowProfitCols(!showProfitCols)}
                  style={{
                    background: showProfitCols ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: showProfitCols ? '#fca5a5' : '#7dd3fc',
                    border: showProfitCols ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  {showProfitCols ? 'RECOLHER PRECIFICAÇÃO' : 'EXIBIR PRECIFICAÇÃO'}
                </button>
                <button 
                  className="btn-action"
                  onClick={() => setShowPerf90dCols(!showPerf90dCols)}
                  style={{
                    background: showPerf90dCols ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                    color: showPerf90dCols ? '#fca5a5' : '#d8b4fe',
                    border: showPerf90dCols ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  {showPerf90dCols ? 'RECOLHER VENDA 90D' : 'EXIBIR VENDA 90D'}
                </button>
              </div>
              <div className="legend-text" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center', display: 'flex', gap: '10px' }}>
                <span className="clickable-legend" onClick={() => setActiveGlossary('capital')}><strong><Info size={12} style={{ display: 'inline' }} /> Cap. Liberado</strong> (Economia)</span>
                <span>|</span>
                <span className="clickable-legend" onClick={() => setActiveGlossary('estoque_max')}><strong><Info size={12} style={{ display: 'inline' }} /> TT ESTOQUE MÁX</strong> (Financeiro)</span>
                <span>|</span>
                <span className="clickable-legend" onClick={() => setActiveGlossary('lucro_varejo')}><strong><Info size={12} style={{ display: 'inline' }} /> % LUCRO VAR.</strong> (Margem)</span>
                <span>|</span>
                <span className="clickable-legend" onClick={() => setActiveGlossary('cobertura')}><strong><Info size={12} style={{ display: 'inline' }} /> COBERTURA</strong> (Dias)</span>
              </div>
            </div>

            {/* Tabela Principal */}
            <div className="table-full-width animate-fade-in" style={{ marginBottom: '1rem' }}>
              <PivotTable
                data={filteredData}
                draftEdits={draftEdits}
                drillDownFields={['DESCRICAO_SECAO', 'DESCRICAO_GRUPO', 'DESCRICAO_SUBGRUPO', 'DESCRICAO_PRODUTO', 'NOME_LOJA']}
                title="ESTRUTURA MERCADOLÓGICA (Drill-Down até Nível Produto)"
                onEditChange={handleEditChange}
                modelosList={modelosList}
                showProfitCols={showProfitCols}
                showPerf90dCols={showPerf90dCols}
              />
            </div>

            {/* Botão de Salvar Flutuante */}
            {hasDrafts && (
              <div className="floating-save-panel animate-fade-in">
                <div className="draft-info">
                  <strong>{Object.keys(draftEdits).length}</strong> produto(s) modificado(s)
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-danger" onClick={() => setDraftEdits({})}>
                    <X size={18} /> Descartar Alterações
                  </button>
                  <button className="btn-save" onClick={() => setIsConfirmingSave(true)} disabled={saving}>
                    <Save size={18} /> Revisar e Salvar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Renders Modal if Active */}
      {renderGlossaryModal()}
      {renderSaveConfirmationModal()}
      <Suspense fallback={<div className="modal-overlay"><div className="loader-text">Carregando componente...</div></div>}>
        {isSimulateModalOpen && <SimulateProductModal
          isOpen={isSimulateModalOpen}
          data={data}
          onClose={() => setIsSimulateModalOpen(false)}
          onAddSimulation={handleAddSimulation}
        />}
        {isAuditModalOpen && <AuditHistoryModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
        />}
        {showWhatsNew && <WhatsNewModal 
          isOpen={showWhatsNew} 
          onClose={() => setShowWhatsNew(false)} 
        />}
        {showDocs && <DocsModal 
          isOpen={showDocs} 
          onClose={() => setShowDocs(false)} 
        />}
      </Suspense>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
          <div className="modal-content filter-modal-content" onClick={e => e.stopPropagation()} style={{ width: '800px', maxWidth: '90vw', padding: 0 }}>
            <div className="modal-header">
              <h3>Filtros Avançados</h3>
              <button className="close-btn" onClick={() => setIsFilterModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '0', maxHeight: '70vh', overflowY: 'auto' }}>
              <SidebarFilters
                data={data}
                filters={filters}
                setFilters={setFilters}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                specialFilters={specialFilters}
                setSpecialFilters={setSpecialFilters}
              />
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-save" onClick={() => setIsFilterModalOpen(false)}>Aplicar Filtros</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
