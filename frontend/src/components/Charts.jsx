import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import './Charts.css';

const COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316'];

const formatCompactNumber = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(0);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip glass-panel-dark">
        <p className="label">{`${label}`}</p>
        {payload.map((p, index) => (
          <p key={index} style={{ color: p.color }}>
            {p.name}: {p.name.includes('GMROI') ? `${Number(p.value).toFixed(2)}x` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const LojaBarChart = React.memo(({ data, onChartClick }) => {
  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, row) => {
      const loja = row.NOME_LOJA || 'Desconhecida';
      if (!acc[loja]) acc[loja] = { id: loja, name: loja, lucro: 0, estoque: 0 };
      acc[loja].lucro += parseFloat(row.LUCRO_BRUTO_30D) || 0;
      acc[loja].estoque += parseFloat(row.VALOR_ESTOQUE_CUSTO_NOVO) || 0;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.lucro - a.lucro);
  }, [data]);

  return (
    <div className="chart-container glass-panel">
      <h3>Performance por Loja (Lucro vs Estoque)</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
            <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickFormatter={(value) => `R$${formatCompactNumber(value)}`} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }}/>
            <Bar dataKey="lucro" name="Lucro Bruto (30d)" fill="#10b981" radius={[4, 4, 0, 0]} onClick={(data) => onChartClick && onChartClick('NOME_LOJA', data.id)} cursor="pointer">
              <LabelList dataKey="lucro" position="top" formatter={formatCompactNumber} fill="#cbd5e1" fontSize={10} />
            </Bar>
            <Bar dataKey="estoque" name="Estoque Investido" fill="#38bdf8" radius={[4, 4, 0, 0]} onClick={(data) => onChartClick && onChartClick('NOME_LOJA', data.id)} cursor="pointer">
              <LabelList dataKey="estoque" position="top" formatter={formatCompactNumber} fill="#cbd5e1" fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export const CurvaBarChart = React.memo(({ data, onChartClick }) => {
  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, row) => {
      const curva = row.CURVA || 'Outros';
      if (!acc[curva]) acc[curva] = { id: curva, name: curva, value: 0 };
      acc[curva].value += parseFloat(row.VALOR_ESTOQUE_MAX_NOVO) || 0;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div className="chart-container glass-panel">
      <h3>Distribuição do Estoque por Curva</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
            <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickFormatter={(value) => `R$${formatCompactNumber(value)}`} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Valor Estoque Máx" radius={[4, 4, 0, 0]} onClick={(data) => onChartClick && onChartClick('CURVA', data.id)} cursor="pointer">
              <LabelList dataKey="value" position="top" formatter={formatCompactNumber} fill="#cbd5e1" fontSize={10} />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});


export const ClassificacaoBarChart = React.memo(({ data, onChartClick }) => {
  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, row) => {
      const classif = row.CLASSIFICACAO || 'Não Informada';
      if (!acc[classif]) acc[classif] = { id: classif, name: classif, value: 0 };
      acc[classif].value += parseFloat(row.VALOR_ESTOQUE_MAX_NOVO) || 0;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div className="chart-container glass-panel">
      <h3>Distribuição por Classificação</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 11}} />
            <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(value) => `R$${formatCompactNumber(value)}`} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Valor Estoque Máx" radius={[4, 4, 0, 0]} onClick={(data) => onChartClick && onChartClick('CLASSIFICACAO', data.id)} cursor="pointer">
              <LabelList dataKey="value" position="top" formatter={formatCompactNumber} fill="#cbd5e1" fontSize={10} />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

const ScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip glass-panel-dark">
        <p className="label" style={{fontWeight: 'bold', color: 'var(--accent-color)'}}>{data.name}</p>
        <p style={{color: '#cbd5e1'}}>Estoque Máx: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.maxValor)}</p>
        <p style={{color: '#cbd5e1'}}>Vendas/Mês: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.vendasMensais)}</p>
        <p style={{color: '#cbd5e1'}}>Cobertura: {data.realCobertura.toFixed(1)} dias</p>
      </div>
    );
  }
  return null;
};

export const CapitalScatterChart = React.memo(({ data, onChartClick }) => {
  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, row) => {
      const subgrupo = row.DESCRICAO_SUBGRUPO || 'Não Informado';
      if (!acc[subgrupo]) acc[subgrupo] = { 
        id: subgrupo, 
        name: subgrupo, 
        maxValor: 0, 
        vendasMensais: 0 
      };
      acc[subgrupo].maxValor += parseFloat(row.VALOR_ESTOQUE_MAX_NOVO) || 0;
      acc[subgrupo].vendasMensais += parseFloat(row.MEDIA_VENDA_MENSAL) || 0;
      return acc;
    }, {});

    return Object.values(grouped).map(g => {
      const cobertura = g.vendasMensais > 0 ? (g.maxValor / g.vendasMensais) * 30 : 0;
      // Limita a cobertura visual a 150 dias para não deformar o gráfico se houver outliers absurdos
      return {
        ...g,
        cobertura: cobertura > 150 ? 150 : cobertura, 
        realCobertura: cobertura 
      };
    }).filter(g => g.maxValor > 0);
  }, [data]);

  return (
    <div className="chart-container glass-panel" style={{ gridColumn: '1 / -1' }}>
      <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Dinheiro Parado vs Cobertura (Por Subgrupo)</span>
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <strong>Bússola:</strong> Eixo Vertical (Capital Imobilizado R$) | Eixo Horizontal (Dias de Cobertura) | Tamanho da Bolha (Volume de Vendas).<br/>
        <span style={{color: '#ef4444'}}>Atenção ao quadrante superior direito (Bolas Vermelhas Altas): Muito dinheiro empatado que demora para vender. Clique na bolha para filtrar o subgrupo.</span>
      </p>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" dataKey="cobertura" name="Cobertura" unit="d" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
            <YAxis type="number" dataKey="maxValor" name="Estoque Máx" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(value) => `R$${formatCompactNumber(value)}`} />
            <ZAxis type="number" dataKey="vendasMensais" range={[40, 600]} name="Vendas" />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
            <Scatter name="Subgrupos" data={chartData} fill="#ef4444" onClick={(data) => onChartClick && onChartClick('DESCRICAO_SUBGRUPO', data.id)} cursor="pointer">
              {chartData.map((entry, index) => {
                let color = "#10b981"; // Saudável
                if (entry.realCobertura < 10) color = "#ef4444"; // Ruptura
                else if (entry.realCobertura > 60) color = "#ef4444"; // Dinheiro Parado
                else if (entry.realCobertura > 35) color = "#f59e0b"; // Alerta Amarelo
                return <Cell key={`cell-${index}`} fill={color} style={{ transition: 'all 0.3s' }} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
