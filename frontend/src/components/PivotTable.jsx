import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import './PivotTable.css';

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatNumber = (val) => new Intl.NumberFormat('pt-BR').format(val);

const getCurvaStyle = (str) => {
  if (!str || str === 'NÃO INFORMADA') {
    return { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(255, 255, 255, 0.2)' };
  }
  
  const upperStr = str.toUpperCase();
  
  if (upperStr === 'TOP') {
    return { background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.4)' }; // Roxo
  } else if (['AAA', 'AA', 'A'].includes(upperStr)) {
    return { background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' }; // Vermelho
  } else if (['BB', 'B'].includes(upperStr)) {
    return { background: 'rgba(234, 179, 8, 0.2)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.4)' }; // Amarelo
  } else if (upperStr === 'C') {
    return { background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.4)' }; // Verde
  } else if (upperStr === 'D') {
    return { background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)' }; // Azul
  } else if (upperStr === 'E') {
    return { background: 'rgba(107, 114, 128, 0.2)', color: '#d1d5db', border: '1px solid rgba(107, 114, 128, 0.4)' }; // Cinza
  }
  
  // Default (fallback)
  return { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(255, 255, 255, 0.2)' };
};

const getPapelCategoriaStyle = (str) => {
  if (!str) return {};
  const upperStr = str.toUpperCase();
  
  if (upperStr === 'TOP') {
    return { background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.4)' }; // Roxo
  } else if (upperStr === 'PREMIUM') {
    return { background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)' }; // Azul
  } else if (upperStr === 'INTERMEDIÁRIO' || upperStr === 'INTERMEDIARIO') {
    return { background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', border: '1px solid rgba(249, 115, 22, 0.4)' }; // Laranja
  } else if (upperStr === 'COMBATE') {
    return { background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' }; // Vermelho
  }
  
  return {};
};

import TreeWorker from '../workers/treeWorker?worker';

const PivotRow = React.memo(({ node, isTotal = false, onEditChange, onEditSimulationRequest, onRemoveSimulation, drillDownFields, modelosList, showProfitCols, showPerf90dCols, path = '', selectedRowKey, setSelectedRowKey }) => {
  const [expanded, setExpanded] = useState(false);
  const m = node.metrics;

  const currentPath = path ? `${path}-${node.key}` : String(node.key);
  const isSelected = selectedRowKey === currentPath;

  const hasChildren = node.children && node.children.length > 0;
  const isSkuRow = !hasChildren && onEditChange && node.depth === drillDownFields.length - 1;
  const isProductRow = node.depth === 3;

  // Estado local para digitação sem lag
  const [localMin, setLocalMin] = useState(isSkuRow ? node.rows[0].QTD_MIN_REAL : 0);
  const [localMax, setLocalMax] = useState(isSkuRow ? node.rows[0].QTD_MAX_REAL : 0);
  const [localReferencia, setLocalReferencia] = useState(isProductRow && node.rows ? (node.rows[0].REFERENCIA || '') : '');
  const [localModelo, setLocalModelo] = useState(isProductRow && node.rows ? (node.rows[0].MODELO || '') : '');
  const [localCompetitividade, setLocalCompetitividade] = useState(isProductRow && node.rows ? (node.rows[0].PERC_COMPETITIVIDADE || 0) : 0);
  const [localLucroEncarte, setLocalLucroEncarte] = useState(isProductRow && node.rows ? (node.rows[0].PERC_LUCRO_ENCARTE || 0) : 0);
  const [localLucroTv, setLocalLucroTv] = useState(isProductRow && node.rows ? (node.rows[0].PERC_LUCRO_TV || 0) : 0);
  const [localInativo, setLocalInativo] = useState(node.depth >= 3 && node.rows ? node.rows[0].INATIVO_COMPRA_REAL === 'T' : false);

  // Sincroniza estado local caso os dados globais mudem (Ex: botão Descartar Alterações)
  useEffect(() => {
    if (isSkuRow) {
      setLocalMin(node.rows[0].QTD_MIN_REAL);
      setLocalMax(node.rows[0].QTD_MAX_REAL);
    }
    if (isProductRow && node.rows) {
      setLocalReferencia(node.rows[0].REFERENCIA || '');
      setLocalModelo(node.rows[0].MODELO || '');
      setLocalCompetitividade(node.rows[0].PERC_COMPETITIVIDADE || 0);
      setLocalLucroEncarte(node.rows[0].PERC_LUCRO_ENCARTE || 0);
      setLocalLucroTv(node.rows[0].PERC_LUCRO_TV || 0);
    }
    if (node.depth >= 3 && node.rows) {
      setLocalInativo(node.rows[0].INATIVO_COMPRA_REAL === 'T');
    }
  }, [isSkuRow, isProductRow, node.depth, node.rows]);

  const diff = m.valMaxNovo - m.valMaxAtual;
  const isDiffNegative = diff < 0;
  const cobertura = m.mediaVendaMensal > 0 ? (m.valMaxNovo / m.mediaVendaMensal) * 30 : 0;

  // Cores semânticas de cobertura (<=15 vermelho, <=21 laranja, <=30 amarelo, <=40 verde, >40 roxo)
  let cobStyle = {};
  if (!isTotal) {
    if (cobertura <= 15) cobStyle = { background: '#ef4444', color: 'white', border: 'none' }; // Vermelho
    else if (cobertura <= 21) cobStyle = { background: '#f97316', color: 'white', border: 'none' }; // Laranja
    else if (cobertura <= 30) cobStyle = { background: '#eab308', color: '#0f172a', border: 'none' }; // Amarelo (texto escuro para contraste)
    else if (cobertura <= 40) cobStyle = { background: '#10b981', color: 'white', border: 'none' }; // Verde
    else cobStyle = { background: '#8b5cf6', color: 'white', border: 'none' }; // Roxo
  }

  const paddingLeft = isTotal ? 0 : node.depth * 1.5;

  let percLucroVarejo = 0;
  if (!isTotal && (isProductRow || isSkuRow) && parseFloat(node.rows[0].PRECO_VAREJO) > 0) {
    const preco = parseFloat(node.rows[0].PRECO_VAREJO);
    const custo = parseFloat(node.rows[0].CUSTO_GERENC);
    percLucroVarejo = ((preco - custo) / preco) * 100;
  } else if (m.valMaxNovo > 0) {
    percLucroVarejo = ((m.valMaxNovo - m.estoqueCusto) / m.valMaxNovo) * 100;
  }

  // Cálculos Perf 90D
  const formatMultiplier = (val) => val ? `${val.toFixed(2).replace('.', ',')}x` : '-';
  const formatPerc = (val) => val ? `${val.toFixed(2).replace('.', ',')}%` : '-';

  let perfVendaTotal = m.perfVendaTotal;
  let perfVendaPromo = m.perfRebaixoValor + m.perfEncarteValor + m.perfTvValor;
  let perfVendaFO = perfVendaTotal - perfVendaPromo;
  let perfQtdFO = m.perfQtdTotal - (m.perfRebaixoQtd + m.perfEncarteQtd + m.perfTvQtd);
  let perfLucroFO = m.perfLucroTotal - (m.perfRebaixoLucro + m.perfEncarteLucro + m.perfTvLucro);

  let foMediaDia = perfVendaFO / 90;
  let foMediaMes = perfVendaFO / 3;
  let foPrecoMedio = perfQtdFO > 0 ? perfVendaFO / perfQtdFO : 0;
  let foMargem = perfVendaFO > 0 ? (perfLucroFO / perfVendaFO) * 100 : 0;

  let encPart = perfVendaTotal > 0 ? (m.perfEncarteValor / perfVendaTotal) * 100 : 0;
  let encPrecoMedio = m.perfEncarteQtd > 0 ? m.perfEncarteValor / m.perfEncarteQtd : 0;
  let encMargem = m.perfEncarteValor > 0 ? (m.perfEncarteLucro / m.perfEncarteValor) * 100 : 0;

  let tvPart = perfVendaTotal > 0 ? (m.perfTvValor / perfVendaTotal) * 100 : 0;
  let tvPrecoMedio = m.perfTvQtd > 0 ? m.perfTvValor / m.perfTvQtd : 0;
  let tvMargem = m.perfTvValor > 0 ? (m.perfTvLucro / m.perfTvValor) * 100 : 0;

  let rebPart = perfVendaTotal > 0 ? (m.perfRebaixoValor / perfVendaTotal) * 100 : 0;
  let rebPrecoMedio = m.perfRebaixoQtd > 0 ? m.perfRebaixoValor / m.perfRebaixoQtd : 0;
  let rebMargem = m.perfRebaixoValor > 0 ? (m.perfRebaixoLucro / m.perfRebaixoValor) * 100 : 0;

  let qtdPromo = m.perfEncarteQtd + m.perfTvQtd; // Removido Rebaixo a pedido
  let elasticidade = perfQtdFO > 0 ? qtdPromo / perfQtdFO : 0;
  let saving = perfVendaTotal > 0 ? (m.perfPerdaTotal / perfVendaTotal) * 100 : 0;

  const handleClick = (e) => {
    if (e.target.tagName.match(/INPUT|SELECT|BUTTON/i)) return;
    if (setSelectedRowKey) setSelectedRowKey(currentPath);
  };

  const handleDoubleClick = (e) => {
    if (e.target.tagName.match(/INPUT|SELECT|BUTTON/i)) return;
    if (hasChildren) {
      window.getSelection().removeAllRanges(); // Evita o texto ficar selecionado ao dar double click
      setExpanded(!expanded);
    }
  };

  return (
    <React.Fragment>
      <tr 
        className={`${isTotal ? 'total-row' : ''} depth-${node.depth} ${isSelected ? 'row-selected' : ''}`} 
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: hasChildren ? 'pointer' : 'default' }}
      >
        <td style={{ paddingLeft: `${paddingLeft + 0.5}rem` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {hasChildren ? (
              expanded ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />
            ) : (
              <span style={{ width: '16px', display: 'inline-block', marginRight: '4px' }}></span>
            )}
            {node.key}
            {node.field === 'DESCRICAO_PRODUTO' && String(node.rows[0]?.COD_INTERNO || '').startsWith('SIM-') && (
              <span style={{ 
                marginLeft: '8px', 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.65rem', 
                background: 'rgba(245, 158, 11, 0.2)', 
                color: '#fcd34d', 
                padding: '2px 6px', 
                borderRadius: '4px',
                border: '1px solid rgba(245, 158, 11, 0.4)'
              }}>
                SIMULADO
                <Edit2 
                  size={10} 
                  style={{ cursor: 'pointer', opacity: 0.8 }} 
                  title="Editar Simulação"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditSimulationRequest) {
                      onEditSimulationRequest(node.rows[0].COD_INTERNO);
                    }
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                />
                <Trash2
                  size={10}
                  style={{ cursor: 'pointer', opacity: 0.8, color: '#ef4444' }}
                  title="Excluir Simulação"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRemoveSimulation) {
                      onRemoveSimulation(node.rows[0].COD_INTERNO);
                    }
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                />
              </span>
            )}
          </div>
        </td>
        <td className="text-center">
          {!isTotal && node.depth === 3 ? (
            <span className="badge-classificacao" style={{ 
              fontSize: '0.75rem', 
              padding: '2px 8px', 
              borderRadius: '6px', 
              ...getCurvaStyle(node.rows[0].CURVA)
            }}>
              {node.rows[0].CURVA}
            </span>
          ) : ''}
        </td>
        <td className="text-center">
          {!isTotal ? (
            isProductRow ? (
              <select 
                className="edit-input custom-scrollbar" 
                style={{ width: 'auto', minWidth: '140px', textAlign: 'center', backgroundColor: 'transparent', ...getPapelCategoriaStyle(localReferencia) }}
                value={localReferencia}
                disabled={localInativo}
                onChange={(e) => {
                  setLocalReferencia(e.target.value);
                  onEditChange(node.rows[0].EMPRESA, node.rows[0].COD_INTERNO, 'referencia', e.target.value, node.rows[0].IDPRODUTO);
                }}
              >
                <option value="" style={{ background: '#1e293b', color: 'white' }}>(Nenhum)</option>
                <option value="TOP" style={{ background: '#1e293b', color: 'white' }}>TOP</option>
                <option value="PREMIUM" style={{ background: '#1e293b', color: 'white' }}>PREMIUM</option>
                <option value="INTERMEDIARIO" style={{ background: '#1e293b', color: 'white' }}>INTERMEDIARIO</option>
                <option value="COMBATE" style={{ background: '#1e293b', color: 'white' }}>COMBATE</option>
              </select>
            ) : ''
          ) : ''}
        </td>
        <td className="text-center">
          {!isTotal ? (
            isProductRow ? (
              <select 
                className="edit-input custom-scrollbar" 
                style={{ width: 'auto', minWidth: '180px', maxWidth: '400px', textAlign: 'center', backgroundColor: 'transparent', color: 'inherit' }}
                value={localModelo}
                disabled={localInativo}
                onChange={(e) => {
                  setLocalModelo(e.target.value);
                  onEditChange(node.rows[0].EMPRESA, node.rows[0].COD_INTERNO, 'modelo', e.target.value, node.rows[0].IDPRODUTO);
                }}
              >
                <option value="" style={{ background: '#1e293b', color: 'white' }}>(Nenhum)</option>
                {modelosList && modelosList.map(m => (
                  <option key={m.IDMODELO} value={m.DESCRMODELO} style={{ background: '#1e293b', color: 'white' }}>{m.DESCRMODELO}</option>
                ))}
              </select>
            ) : ''
          ) : ''}
        </td>

        <td className="text-right">{formatNumber(m.count)}</td>
        <td className="text-right">
          {isSkuRow ? (
            <span className="text-accent font-bold">
              {formatNumber(m.qtdMinNovo)}
            </span>
          ) : (
            formatNumber(m.qtdMinNovo)
          )}
        </td>
        <td className="text-right">
          {isSkuRow ? (
            <input 
              type="number" 
              className="edit-input" 
              value={localMax} 
              disabled={localInativo}
              onChange={(e) => setLocalMax(e.target.value)}
              onBlur={() => {
                if (parseFloat(localMax) !== node.rows[0].QTD_MAX_REAL) {
                  onEditChange(node.rows[0].EMPRESA, node.rows[0].COD_INTERNO, 'max', localMax, node.rows[0].IDPRODUTO);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
              }}
            />
          ) : (
            formatNumber(m.qtdMaxNovo)
          )}
        </td>
        <td className="text-center">
          {!isTotal && node.depth === 3 ? (
            <input 
              type="checkbox"
              checked={localInativo}
              onChange={(e) => {
                const checked = e.target.checked;
                setLocalInativo(checked);
                if (checked && isSkuRow) {
                  setLocalMin(0);
                  setLocalMax(0);
                }
                onEditChange(node.rows[0].EMPRESA, node.rows[0].COD_INTERNO, 'inativoCompra', checked ? 'T' : 'F', node.rows[0].IDPRODUTO);
              }}
              style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: '#ef4444' }}
              title="Marcar produto como Inativo para Compra em todas as lojas"
            />
          ) : ''}
        </td>
        <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
          {!isTotal && (isProductRow || isSkuRow) ? formatCurrency(node.rows[0].CUSTO_GERENC || 0) : ''}
        </td>
        <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
          {!isTotal && (isProductRow || isSkuRow) ? formatCurrency(node.rows[0].PRECO_VAREJO || 0) : ''}
        </td>
        {showProfitCols && (
          <React.Fragment>
            <td className="text-right" style={{ whiteSpace: 'nowrap', backgroundColor: '#ffffff', border: '1px solid #000000', color: '#10b981', fontWeight: 'bold' }}>
              {!isTotal && (isProductRow || isSkuRow) ? formatCurrency((parseFloat(node.rows[0].PRECO_VAREJO) || 0) - (parseFloat(node.rows[0].CUSTO_GERENC) || 0)) : ''}
            </td>
            <td className="text-right" style={{ whiteSpace: 'nowrap', backgroundColor: '#ffffff', border: '1px solid #000000', color: percLucroVarejo < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
              {percLucroVarejo !== 0 || m.valMaxNovo > 0 || isProductRow || isSkuRow ? `${percLucroVarejo.toFixed(2).replace('.', ',')}%` : ''}
            </td>
            <td className="text-right" style={{ whiteSpace: 'nowrap', backgroundColor: '#ffffff', color: '#000000', border: '1px solid #000000' }}>
              {!isTotal && isProductRow ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <input 
                    type="text" 
                    className="edit-input" 
                    style={{ width: '60px', textAlign: 'right', backgroundColor: '#f8fafc', color: '#000000', borderColor: '#cbd5e1' }}
                    value={String(localCompetitividade).replace('.', ',')} 
                    disabled={localInativo}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9,\-]/g, '');
                      setLocalCompetitividade(val);
                    }}
                    onBlur={() => {
                      let num = parseFloat(String(localCompetitividade).replace(',', '.')) || 0;
                      setLocalCompetitividade(num);
                      if (num !== parseFloat(node.rows[0].PERC_COMPETITIVIDADE || 0)) {
                        onEditChange(node.rows[0].EMPRESA, node.rows[0].COD_INTERNO, 'competitividade', num, node.rows[0].IDPRODUTO);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>%</span>
                </div>
              ) : ''}
            </td>
            <td className="text-right" style={{ whiteSpace: 'nowrap', backgroundColor: '#ffffff', color: '#000000', border: '1px solid #000000' }}>
              {!isTotal && isProductRow ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <input 
                    type="text" 
                    className="edit-input" 
                    style={{ width: '60px', textAlign: 'right', backgroundColor: '#f8fafc', color: '#000000', borderColor: '#cbd5e1' }}
                    value={String(localLucroEncarte).replace('.', ',')} 
                    disabled={localInativo}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9,\-]/g, '');
                      setLocalLucroEncarte(val);
                    }}
                    onBlur={() => {
                      let num = parseFloat(String(localLucroEncarte).replace(',', '.')) || 0;
                      setLocalLucroEncarte(num);
                      if (num !== parseFloat(node.rows[0].PERC_LUCRO_ENCARTE || 0)) {
                        onEditChange(node.rows[0].EMPRESA, node.rows[0].COD_INTERNO, 'lucroEncarte', num, node.rows[0].IDPRODUTO);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>%</span>
                </div>
              ) : ''}
            </td>
            <td className="text-right" style={{ whiteSpace: 'nowrap', backgroundColor: '#ffffff', color: '#000000', border: '1px solid #000000' }}>
              {!isTotal && isProductRow ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <input 
                    type="text" 
                    className="edit-input" 
                    style={{ width: '60px', textAlign: 'right', backgroundColor: '#f8fafc', color: '#000000', borderColor: '#cbd5e1' }}
                    value={String(localLucroTv).replace('.', ',')} 
                    disabled={localInativo}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9,\-]/g, '');
                      setLocalLucroTv(val);
                    }}
                    onBlur={() => {
                      let num = parseFloat(String(localLucroTv).replace(',', '.')) || 0;
                      setLocalLucroTv(num);
                      if (num !== parseFloat(node.rows[0].PERC_LUCRO_TV || 0)) {
                        onEditChange(node.rows[0].EMPRESA, node.rows[0].COD_INTERNO, 'lucroTv', num, node.rows[0].IDPRODUTO);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>%</span>
                </div>
              ) : ''}
            </td>
          </React.Fragment>
        )}
        <td className="text-right">{formatCurrency(m.valMaxNovo)}</td>
        <td className="text-right">{formatCurrency(m.mediaVendaMensal)}</td>
        <td className="text-center">
          {isTotal ? (
            Math.round(cobertura)
          ) : (
            <span className="badge-cobertura" style={cobStyle}>
              {Math.round(cobertura)} d
            </span>
          )}
        </td>
        {showPerf90dCols && (
          <React.Fragment>
            {/* FORA DE OFERTA */}
            <td className="text-right" style={{ backgroundColor: '#e0e7ff', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(perfVendaFO)}</td>
            <td className="text-right" style={{ backgroundColor: '#e0e7ff', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(foMediaDia)}</td>
            <td className="text-right" style={{ backgroundColor: '#e0e7ff', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(foMediaMes)}</td>
            <td className="text-right" style={{ backgroundColor: '#e0e7ff', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(foPrecoMedio)}</td>
            <td className="text-right" style={{ backgroundColor: '#e0e7ff', border: '1px solid rgba(0, 0, 0, 0.15)', color: foMargem < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{formatPerc(foMargem)}</td>

            {/* ENCARTE */}
            <td className="text-right" style={{ backgroundColor: '#fef3c7', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(m.perfEncarteValor)}</td>
            <td className="text-right" style={{ backgroundColor: '#fef3c7', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatPerc(encPart)}</td>
            <td className="text-right" style={{ backgroundColor: '#fef3c7', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(encPrecoMedio)}</td>
            <td className="text-right" style={{ backgroundColor: '#fef3c7', border: '1px solid rgba(0, 0, 0, 0.15)', color: encMargem < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{formatPerc(encMargem)}</td>

            {/* TV */}
            <td className="text-right" style={{ backgroundColor: '#f3e8ff', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(m.perfTvValor)}</td>
            <td className="text-right" style={{ backgroundColor: '#f3e8ff', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatPerc(tvPart)}</td>
            <td className="text-right" style={{ backgroundColor: '#f3e8ff', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(tvPrecoMedio)}</td>
            <td className="text-right" style={{ backgroundColor: '#f3e8ff', border: '1px solid rgba(0, 0, 0, 0.15)', color: tvMargem < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{formatPerc(tvMargem)}</td>

            {/* REBAIXO */}
            <td className="text-right" style={{ backgroundColor: '#ffe4e6', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(m.perfRebaixoValor)}</td>
            <td className="text-right" style={{ backgroundColor: '#ffe4e6', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatPerc(rebPart)}</td>
            <td className="text-right" style={{ backgroundColor: '#ffe4e6', color: '#000000', border: '1px solid rgba(0, 0, 0, 0.15)' }}>{formatCurrency(rebPrecoMedio)}</td>
            <td className="text-right" style={{ backgroundColor: '#ffe4e6', border: '1px solid rgba(0, 0, 0, 0.15)', color: rebMargem < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{formatPerc(rebMargem)}</td>
          </React.Fragment>
        )}

        {/* INDICADORES */}
        <td className="text-right font-bold text-accent" style={{ backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>{formatMultiplier(elasticidade)}</td>
        <td className="text-right font-bold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.02)', color: '#ef4444' }}>{formatPerc(saving)}</td>
      </tr>
      {expanded && hasChildren && node.children.map((child, i) => (
        <PivotRow key={`${child.key}-${i}`} node={child} onEditChange={onEditChange} onEditSimulationRequest={onEditSimulationRequest} onRemoveSimulation={onRemoveSimulation} drillDownFields={drillDownFields} modelosList={modelosList} showProfitCols={showProfitCols} showPerf90dCols={showPerf90dCols} path={currentPath} selectedRowKey={selectedRowKey} setSelectedRowKey={setSelectedRowKey} />
      ))}
    </React.Fragment>
  );
}, (prevProps, nextProps) => {
  // areEqual customizado: evita re-render se o clique (selectedRowKey) não afetar esta linha específica
  const currentPath = nextProps.path ? `${nextProps.path}-${nextProps.node.key}` : String(nextProps.node.key);
  
  if (prevProps.selectedRowKey !== nextProps.selectedRowKey) {
    const wasSelected = prevProps.selectedRowKey === currentPath;
    const isSelected = nextProps.selectedRowKey === currentPath;
    const wasAncestor = prevProps.selectedRowKey && prevProps.selectedRowKey.startsWith(currentPath + '-');
    const isAncestor = nextProps.selectedRowKey && nextProps.selectedRowKey.startsWith(currentPath + '-');
    
    // Se o estado de seleção desta linha mudou, ou se um descendente dela foi/será selecionado, re-renderize!
    if (wasSelected || isSelected || wasAncestor || isAncestor) {
      return false; 
    }
  }

  const pm = prevProps.node.metrics;
  const nm = nextProps.node.metrics;

  const metricsEqual = 
    pm.qtdMinNovo === nm.qtdMinNovo &&
    pm.qtdMaxNovo === nm.qtdMaxNovo &&
    pm.estoqueCusto === nm.estoqueCusto &&
    pm.lucroBruto === nm.lucroBruto &&
    pm.valMaxNovo === nm.valMaxNovo;

  return (
    prevProps.node.key === nextProps.node.key &&
    metricsEqual &&
    prevProps.showProfitCols === nextProps.showProfitCols &&
    prevProps.showPerf90dCols === nextProps.showPerf90dCols &&
    prevProps.drillDownFields === nextProps.drillDownFields
  );
});

const PivotTable = ({ data, drillDownFields, title, onEditChange, onEditSimulationRequest, onRemoveSimulation, modelosList, showProfitCols, showPerf90dCols, draftEdits }) => {
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [tree, setTree] = useState([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new TreeWorker();

    workerRef.current.onmessage = (e) => {
      if (e.data.success) {
        setTree(e.data.tree);
      } else {
        console.error("Erro no Worker:", e.data.error);
      }
      setIsBuilding(false);
    };

    return () => workerRef.current.terminate();
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) {
      setTree([]);
      return;
    }

    if (tree.length === 0) {
      setIsBuilding(true);
    }
    
    workerRef.current.postMessage({ action: 'BUILD', data, drillDownFields, draftEdits });
  }, [data, drillDownFields]);

  // Efeito disparado apenas quando draftEdits muda, sem recriar ou reenviar o array gigante (data)
  useEffect(() => {
    if (!data || data.length === 0 || tree.length === 0) return;
    
    // Otimização: Debounce para evitar sobrecarregar o Worker e a thread principal
    // durante edições em massa ou digitações rápidas
    const handler = setTimeout(() => {
      workerRef.current.postMessage({ action: 'UPDATE_DRAFTS', draftEdits });
    }, 400);

    return () => clearTimeout(handler);
  }, [draftEdits]);

  if (isBuilding && tree.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Organizando estrutura hierárquica (Web Worker)...</p>
      </div>
    );
  }

  if (!tree || tree.length === 0) return null;

  // Totais
  const totalMetrics = tree.reduce((acc, node) => {
    acc.count += node.metrics.count;
    acc.valMaxAtual += node.metrics.valMaxAtual;
    acc.valMaxNovo += node.metrics.valMaxNovo;
    acc.mediaVendaMensal += node.metrics.mediaVendaMensal;
    acc.lucroBruto += node.metrics.lucroBruto;
    acc.estoqueCusto += node.metrics.estoqueCusto;
    acc.qtdMinNovo += node.metrics.qtdMinNovo;
    acc.qtdMaxNovo += node.metrics.qtdMaxNovo;

    // Métricas Perf 90D
    acc.perfVendaTotal += node.metrics.perfVendaTotal || 0;
    acc.perfQtdTotal += node.metrics.perfQtdTotal || 0;
    acc.perfLucroTotal += node.metrics.perfLucroTotal || 0;

    acc.perfRebaixoValor += node.metrics.perfRebaixoValor || 0;
    acc.perfRebaixoQtd += node.metrics.perfRebaixoQtd || 0;
    acc.perfRebaixoLucro += node.metrics.perfRebaixoLucro || 0;

    acc.perfEncarteValor += node.metrics.perfEncarteValor || 0;
    acc.perfEncarteQtd += node.metrics.perfEncarteQtd || 0;
    acc.perfEncarteLucro += node.metrics.perfEncarteLucro || 0;

    acc.perfTvValor += node.metrics.perfTvValor || 0;
    acc.perfTvQtd += node.metrics.perfTvQtd || 0;
    acc.perfTvLucro += node.metrics.perfTvLucro || 0;

    acc.perfPerdaTotal += node.metrics.perfPerdaTotal || 0;

    return acc;
  }, { 
    count: 0, valMaxAtual: 0, valMaxNovo: 0, mediaVendaMensal: 0, 
    lucroBruto: 0, estoqueCusto: 0, qtdMinNovo: 0, qtdMaxNovo: 0,
    perfVendaTotal: 0, perfQtdTotal: 0, perfLucroTotal: 0,
    perfRebaixoValor: 0, perfRebaixoQtd: 0, perfRebaixoLucro: 0,
    perfEncarteValor: 0, perfEncarteQtd: 0, perfEncarteLucro: 0,
    perfTvValor: 0, perfTvQtd: 0, perfTvLucro: 0,
    perfPerdaTotal: 0
  });

  return (
    <div className="pivot-table glass-panel">
      <table>
        <thead>
          <tr>
            <th style={{ backgroundColor: '#162c46' }}></th>
            <th className="text-center" colSpan="7" style={{ backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '0.75rem', letterSpacing: '1px' }}>DADOS CADASTRAIS</th>
            <th className="text-center" colSpan={showProfitCols ? 7 : 2} style={{ backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '0.75rem', letterSpacing: '1px' }}>PRECIFICAÇÃO</th>
            <th className="text-center" colSpan="3" style={{ backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '0.75rem', letterSpacing: '1px' }}>ESTOQUE / COBERTURA</th>
            {showPerf90dCols && <th className="text-center" colSpan="17" style={{ backgroundColor: '#172554', color: '#93c5fd', fontSize: '0.75rem', letterSpacing: '1px' }}>VENDA</th>}
            <th className="text-center" colSpan="2" style={{ backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '0.75rem', letterSpacing: '1px' }}>INDICADORES</th>
          </tr>
          <tr>
            <th>{title}</th>
            <th className="text-center" title="Curva ABC do Produto">CURVA</th>
            <th className="text-center" title="Papel da Categoria do Produto">PAPEL DA CATEGORIA</th>
            <th className="text-center" title="Fabricante ou Marca do Produto">FABRICANTE | MARCA</th>

            <th className="text-right" title="Número de Skus/Produtos distintos agrupados">Nº ITENS</th>
            <th className="text-right text-accent" title="Quantidade Mínima de Segurança">QTD MÍN</th>
            <th className="text-right text-accent" title="Quantidade Máxima Permitida">QTD MÁX</th>
            <th className="text-center text-accent" title="Inativo para Compra" style={{ width: '85px', whiteSpace: 'nowrap' }}>INATIVO C.</th>
            <th 
              className="text-right" 
              style={{ whiteSpace: 'nowrap', width: '80px' }}
              title="Custo Gerencial"
            >
              CUSTO G. 
            </th>
            <th 
              className="text-right" 
              style={{ whiteSpace: 'nowrap', width: '85px', color: '#38bdf8' }}
              title="Preço Varejo"
            >
              PR VAREJO 
            </th>
            {showProfitCols && (
              <React.Fragment>
                <th 
                  className="text-right" 
                  style={{ whiteSpace: 'nowrap', width: '85px', color: '#10b981' }}
                  title="Margem de Contribuição Unitária (Preço Varejo - Custo Gerencial)"
                >
                  MCU (R$)
                </th>
                <th className="text-right" title="Margem de Lucro Bruto (%) sobre o Varejo" style={{ whiteSpace: 'nowrap', width: '85px' }}>% LUCRO VAR.</th>
                <th className="text-right" title="% Competitividade (Largura)" style={{ whiteSpace: 'nowrap', width: '85px' }}>% COMP.</th>
                <th className="text-right" title="% Lucro Encarte (Comprimento)" style={{ whiteSpace: 'nowrap', width: '85px' }}>% L. ENCARTE</th>
                <th className="text-right" title="% Lucro TV (Altura)" style={{ whiteSpace: 'nowrap', width: '85px' }}>% L. TV</th>
              </React.Fragment>
            )}
            <th className="text-right" title="Valor Financeiro em Reais (R$) do Estoque Máximo Simulável">TT ESTOQUE MÁX.</th>
            <th className="text-right" title="Valor Médio Mensal Vendido (R$)">MÉDIA VENDA MÊS</th>
            <th className="text-center" title="Quantos dias o Estoque Máximo cobre baseado na média de vendas">
              COBERTURA
            </th>
            {showPerf90dCols && (
              <React.Fragment>
                {/* FORA DE OFERTA */}
                <th className="text-right perf-col" style={{ backgroundColor: '#1e3a8a', color: '#e0e7ff' }} title="Valor total vendido fora de oferta (R$)">F.O. R$ VENDA</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#1e3a8a', color: '#e0e7ff' }} title="Média de valor vendido por dia fora de oferta">F.O. MÉDIA DIA</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#1e3a8a', color: '#e0e7ff' }} title="Média de valor vendido por mês fora de oferta">F.O. MÉDIA MÊS</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#1e3a8a', color: '#e0e7ff' }} title="Preço médio praticado fora de oferta">F.O. PREÇO MÉD</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#1e3a8a', color: '#e0e7ff' }} title="Margem de lucro médio fora de oferta (%)">F.O. % MARGEM</th>

                {/* ENCARTE */}
                <th className="text-right perf-col" style={{ backgroundColor: '#b45309', color: '#fef3c7' }} title="Valor total vendido no encarte (R$)">ENC. R$ VENDA</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#b45309', color: '#fef3c7' }} title="Participação da venda do encarte sobre a venda total (%)">ENC. % PART.</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#b45309', color: '#fef3c7' }} title="Preço médio praticado no encarte">ENC. PREÇO MÉD</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#b45309', color: '#fef3c7' }} title="Margem de lucro médio no encarte (%)">ENC. % MARGEM</th>

                {/* TV */}
                <th className="text-right perf-col" style={{ backgroundColor: '#6b21a8', color: '#f3e8ff' }} title="Valor total vendido na TV (R$)">TV R$ VENDA</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#6b21a8', color: '#f3e8ff' }} title="Participação da venda na TV sobre a venda total (%)">TV % PART.</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#6b21a8', color: '#f3e8ff' }} title="Preço médio praticado na TV">TV PREÇO MÉD</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#6b21a8', color: '#f3e8ff' }} title="Margem de lucro médio na TV (%)">TV % MARGEM</th>

                {/* REBAIXO */}
                <th className="text-right perf-col" style={{ backgroundColor: '#9f1239', color: '#ffe4e6' }} title="Valor total vendido no rebaixo (R$)">REB. R$ VENDA</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#9f1239', color: '#ffe4e6' }} title="Participação da venda no rebaixo sobre a venda total (%)">REB. % PART.</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#9f1239', color: '#ffe4e6' }} title="Preço médio praticado no rebaixo">REB. PREÇO MÉD</th>
                <th className="text-right perf-col" style={{ backgroundColor: '#9f1239', color: '#ffe4e6' }} title="Margem de lucro médio no rebaixo (%)">REB. % MARGEM</th>
              </React.Fragment>
            )}

            {/* INDICADORES */}
            <th className="text-right perf-col" title="Multiplicador de elasticidade: qtd. vendida em oferta ÷ qtd. vendida fora de oferta">ELASTICIDADE</th>
            <th className="text-right perf-col" title="Percentual de quebra: Valor de perda (90d) ÷ Valor de venda (90d)">% SAVING</th>
          </tr>
        </thead>
        <tbody>
          {tree.map((node, i) => (
            <PivotRow key={`${node.key}-${i}`} node={node} onEditChange={onEditChange} onEditSimulationRequest={onEditSimulationRequest} onRemoveSimulation={onRemoveSimulation} drillDownFields={drillDownFields} modelosList={modelosList} showProfitCols={showProfitCols} showPerf90dCols={showPerf90dCols} selectedRowKey={selectedRowKey} setSelectedRowKey={setSelectedRowKey} />
          ))}
        </tbody>
        <tfoot>
          <PivotRow node={{ key: 'Total Geral', depth: 0, metrics: totalMetrics }} isTotal={true} onEditChange={onEditChange} drillDownFields={drillDownFields} modelosList={modelosList} showProfitCols={showProfitCols} showPerf90dCols={showPerf90dCols} />
        </tfoot>
      </table>
    </div>
  );
};

export default PivotTable;
