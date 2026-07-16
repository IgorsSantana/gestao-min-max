import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, X } from 'lucide-react';
import './SidebarFilters.css';

const SidebarFilters = ({ data, filters, setFilters, searchQuery, setSearchQuery, specialFilters, setSpecialFilters }) => {
  // Extrair valores únicos
  const uniqueValues = (key) => {
    const vals = data.map(item => item[key]).filter(v => v !== null && v !== undefined);
    return [...new Set(vals)].sort();
  };

  const lojas = useMemo(() => uniqueValues('NOME_LOJA'), [data]);
  const curvas = useMemo(() => uniqueValues('CURVA'), [data]);
  const compradores = useMemo(() => uniqueValues('COMPRADOR'), [data]);
  const secoes = useMemo(() => uniqueValues('DESCRICAO_SECAO'), [data]);
  const grupos = useMemo(() => uniqueValues('DESCRICAO_GRUPO'), [data]);
  const subgrupos = useMemo(() => uniqueValues('DESCRICAO_SUBGRUPO'), [data]);
  const referencias = useMemo(() => uniqueValues('REFERENCIA'), [data]);
  const modelos = useMemo(() => uniqueValues('MODELO'), [data]);

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const [collapsed, setCollapsed] = useState({
    NOME_LOJA: false,
    CURVA: false,
    REFERENCIA: true,
    MODELO: true,
    COMPRADOR: true,
    DESCRICAO_SECAO: true,
    DESCRICAO_GRUPO: true,
    DESCRICAO_SUBGRUPO: true
  });

  const toggleCollapse = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderFilterBox = (title, key, options) => {
    const isCollapsed = collapsed[key];
    const hasActiveFilters = (filters[key] || []).length > 0;

    return (
      <div className="filter-group" key={key}>
        <div className="filter-header" onClick={() => toggleCollapse(key)}>
          <div className="filter-header-left">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            <h4 style={{ margin: 0, color: hasActiveFilters ? '#38bdf8' : 'inherit' }}>
              {title} {hasActiveFilters && `(${filters[key].length})`}
            </h4>
          </div>
          {hasActiveFilters && (
            <button 
              className="clear-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setFilters(prev => ({ ...prev, [key]: [] }));
              }}
              title="Limpar Filtro"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className="filter-options">
            {options.map(opt => {
              const isActive = (filters[key] || []).includes(opt);
              return (
                <button
                  key={opt}
                  className={`filter-btn ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFilter(key, opt);
                  }}
                >
                  {opt || '(vazio)'}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="filter-modal-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', padding: '1.5rem' }}>
      <div className="filter-group">
        <div className="filter-header" style={{ cursor: 'default' }}>
          <div className="filter-header-left">
            <h4 style={{ margin: 0 }}>Filtros Rápidos</h4>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
          <button 
            className={`filter-btn ${specialFilters.atencao ? 'active' : ''}`}
            onClick={() => setSpecialFilters(prev => ({ ...prev, atencao: !prev.atencao }))}
            style={{ 
              flex: '1 1 100%',
              width: '100%', 
              justifyContent: 'flex-start', 
              whiteSpace: 'normal',
              height: 'auto',
              textAlign: 'left',
              padding: '10px',
              color: specialFilters.atencao ? '#ef4444' : 'inherit',
              borderColor: specialFilters.atencao ? 'rgba(239, 68, 68, 0.5)' : 'transparent',
              background: specialFilters.atencao ? 'rgba(239, 68, 68, 0.1)' : ''
            }}
          >
            ⚠️ Em Atenção (Ruptura/Excesso)
          </button>
          <button 
            className={`filter-btn ${specialFilters.zerados ? 'active' : ''}`}
            onClick={() => setSpecialFilters(prev => ({ ...prev, zerados: !prev.zerados }))}
            style={{ 
              flex: '1 1 100%',
              width: '100%', 
              justifyContent: 'flex-start',
              whiteSpace: 'normal',
              height: 'auto',
              textAlign: 'left',
              padding: '10px'
            }}
          >
            ❌ Limites Zerados
          </button>
          <button 
            className={`filter-btn ${specialFilters.inativosCompra ? 'active' : ''}`}
            onClick={() => setSpecialFilters(prev => ({ ...prev, inativosCompra: !prev.inativosCompra }))}
            style={{ 
              flex: '1 1 100%',
              width: '100%', 
              justifyContent: 'flex-start',
              whiteSpace: 'normal',
              height: 'auto',
              textAlign: 'left',
              padding: '10px',
              color: specialFilters.inativosCompra ? '#a855f7' : 'inherit',
              borderColor: specialFilters.inativosCompra ? 'rgba(168, 85, 247, 0.5)' : 'transparent',
              background: specialFilters.inativosCompra ? 'rgba(168, 85, 247, 0.1)' : ''
            }}
          >
            🚫 Apenas Inativos p/ Compra
          </button>
          <button 
            className={`filter-btn ${specialFilters.ativosCompra ? 'active' : ''}`}
            onClick={() => setSpecialFilters(prev => ({ ...prev, ativosCompra: !prev.ativosCompra }))}
            style={{ 
              flex: '1 1 100%',
              width: '100%', 
              justifyContent: 'flex-start',
              whiteSpace: 'normal',
              height: 'auto',
              textAlign: 'left',
              padding: '10px',
              color: specialFilters.ativosCompra ? '#10b981' : 'inherit',
              borderColor: specialFilters.ativosCompra ? 'rgba(16, 185, 129, 0.5)' : 'transparent',
              background: specialFilters.ativosCompra ? 'rgba(16, 185, 129, 0.1)' : ''
            }}
          >
            ✅ Apenas Ativos p/ Compra
          </button>
        </div>
      </div>

      {renderFilterBox('LOJA', 'NOME_LOJA', lojas)}
      {renderFilterBox('CURVA', 'CURVA', curvas)}
      {renderFilterBox('PAPEL DA CATEGORIA', 'REFERENCIA', referencias)}
      {renderFilterBox('FABRICANTE | MARCA', 'MODELO', modelos)}
      {renderFilterBox('COMPRADOR', 'COMPRADOR', compradores)}
      {renderFilterBox('GRUPO', 'DESCRICAO_GRUPO', grupos)}
      {renderFilterBox('SUBGRUPO', 'DESCRICAO_SUBGRUPO', subgrupos)}
    </div>
  );
};

export default SidebarFilters;
