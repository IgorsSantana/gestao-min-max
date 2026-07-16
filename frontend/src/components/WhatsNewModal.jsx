import React, { useEffect, useState } from 'react';
import { X, Sparkles, Layout, Palette, Zap, TableProperties, ChevronLeft, ChevronRight } from 'lucide-react';

const WhatsNewModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Efeito para adicionar ou remover a classe no body para travar o scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab(0); // Reset to first slide on open
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const features = [
    {
      icon: <TableProperties className="text-accent" />,
      title: 'Módulo de Precificação e Margens',
      desc: 'Agora você tem total controle sobre os preços e rentabilidade. Inserimos um bloco inteiro focado em precificação:',
      details: [
        'Preço Varejo (PR VAREJO): Exibido lado a lado com o Custo Gerencial.',
        <span>% Lucro Varejo: Calculado automaticamente mostrando a margem bruta da venda normal. <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '3px 8px', borderRadius: '6px', color: 'var(--accent-color)', fontFamily: 'monospace', fontSize: '0.85em', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-block', marginTop: '4px' }}>Fórmula: ((Preço Varejo - Custo Gerencial) / Preço Varejo) * 100</code></span>,
        'Competitividade (%): Ajuste fino para balizar seu preço frente aos concorrentes.',
        'Lucro Encarte (%): Defina e simule a margem esperada nas campanhas de tablóide.',
        'Lucro TV (%): Controle absoluto da margem sacrificada para os itens de ponta de gôndola e TV.'
      ],
      bgColor: 'rgba(56, 189, 248, 0.1)',
      borderColor: 'rgba(56, 189, 248, 0.3)'
    },
    {
      icon: <Palette className="text-warning" />,
      title: 'Métricas de Venda Segmentadas',
      desc: 'Os blocos de venda ganharam cores próprias e métricas detalhadas para cada tipo de promoção (FO, Encarte, TV e Rebaixo):',
      details: [
        <span>Volume e Participação: Analise o valor financeiro vendido e quanto ele representa no total da categoria. <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '3px 8px', borderRadius: '6px', color: 'var(--accent-color)', fontFamily: 'monospace', fontSize: '0.85em', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-block', marginTop: '4px' }}>Fórmula: (Venda da Promoção / Venda Total) * 100</code></span>,
        <span>Preço Médio Praticado: O valor real (ticket médio) que o cliente pagou em cada tipo de campanha. <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '3px 8px', borderRadius: '6px', color: 'var(--accent-color)', fontFamily: 'monospace', fontSize: '0.85em', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-block', marginTop: '4px' }}>Fórmula: (Valor Vendido / Qtd Vendida)</code></span>,
        <span>Margem Realizada (%): Descubra se a promoção deu lucro ou prejuízo, com cores indicativas. <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '3px 8px', borderRadius: '6px', color: 'var(--accent-color)', fontFamily: 'monospace', fontSize: '0.85em', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-block', marginTop: '4px' }}>Fórmula: (Lucro da Promoção / Valor da Promoção) * 100</code></span>,
        <span>Venda Média Diária e Mensal (Apenas F.O.): O motor base do produto fora do efeito promocional. <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '3px 8px', borderRadius: '6px', color: 'var(--accent-color)', fontFamily: 'monospace', fontSize: '0.85em', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-block', marginTop: '4px' }}>Fórmulas: Venda FO / 90 e Venda FO / 3</code></span>
      ],
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.3)'
    },
    {
      icon: <Zap className="text-success" />,
      title: 'Indicadores Avançados (Saving e Elasticidade)',
      desc: 'Mais inteligência de negócio direto na tabela para balizar a sua tomada de decisão em compras:',
      details: [
        <span>Elasticidade: Mede o quanto o produto vende a mais quando entra em promoção (desconsidera rebaixos). <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '3px 8px', borderRadius: '6px', color: 'var(--accent-color)', fontFamily: 'monospace', fontSize: '0.85em', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-block', marginTop: '4px' }}>Fórmula: (Qtd TV + Qtd Encarte) / Qtd Fora de Oferta</code></span>,
        <span>Saving (%): Identifica quanto da venda foi "paga" ou subsidiada por verbas/perdas negociadas. <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '3px 8px', borderRadius: '6px', color: 'var(--accent-color)', fontFamily: 'monospace', fontSize: '0.85em', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-block', marginTop: '4px' }}>Fórmula: (Valor de Perda Total / Venda Total) * 100</code></span>,
        'Totalizador Flexível: Recolha ou expanda os blocos de Precificação e Venda (90D) com um único clique no topo.',
        'Layout Otimizado: Tabela inicia recolhida garantindo velocidade extrema no carregamento.'
      ],
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    {
      icon: <Layout style={{ color: '#8b5cf6' }} />,
      title: 'Ajustes Finos de Usabilidade',
      desc: 'Melhorias cirúrgicas na navegação e nos simuladores:',
      details: [
        'Blindagem no Scroll: Fechamos as bordas da estrutura mercadológica, acabando com o "vazamento" de textos ao rolar para o lado.',
        'Descrições Expandidas: Nomes longos de produtos agora quebram de linha perfeitamente (sem "..." cortando).',
        'Simulador Inteligente: Produtos virtuais agora se agrupam perfeitamente na sua respectiva Loja.',
        'Limpeza de Nomes: Adotamos apenas as siglas oficiais das lojas (BCS, SJN, etc) mantendo a ordenação correta.'
      ],
      bgColor: 'rgba(139, 92, 246, 0.1)',
      borderColor: 'rgba(139, 92, 246, 0.3)'
    }
  ];

  const nextSlide = () => {
    setActiveTab(prev => (prev === features.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveTab(prev => (prev === 0 ? features.length - 1 : prev - 1));
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="modal-content animate-fade-in" style={{
        background: 'var(--bg-color)',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '900px',
        minHeight: '540px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>

        {/* Header do Slide */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.2rem 1.8rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(90deg, rgba(15,23,42,1) 0%, rgba(30,58,138,0.3) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} className="text-accent" />
            <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Release Notes
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Área Principal de Apresentação */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 4rem' }}>

          {/* Seta Esquerda */}
          <button 
            onClick={prevSlide}
            style={{
              position: 'absolute',
              left: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.8rem',
              transition: 'transform 0.2s, color 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <ChevronLeft size={40} />
          </button>

          {/* Conteúdo do Slide */}
          <div className="animate-fade-in" key={activeTab} style={{ width: '100%', maxWidth: '720px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              background: features[activeTab].bgColor,
              border: `1px solid ${features[activeTab].borderColor}`,
              padding: '15px',
              borderRadius: '50%',
              marginBottom: '1rem',
              boxShadow: `0 10px 30px ${features[activeTab].bgColor}`
            }}>
              {React.cloneElement(features[activeTab].icon, { size: 32 })}
            </div>

            <h2 style={{ fontSize: '2.1rem', fontWeight: '800', margin: '0 0 0.8rem 0', color: 'var(--text-primary)' }}>
              {features[activeTab].title}
            </h2>

            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0 auto 2rem auto', maxWidth: '580px', lineHeight: '1.6' }}>
              {features[activeTab].desc}
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'left',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
            }}>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8' }}>
                {features[activeTab].details.map((detail, dIdx) => (
                  <li key={dIdx} style={{ marginBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Seta Direita */}
          <button
            onClick={nextSlide}
            style={{
              position: 'absolute',
              right: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.5rem',
              transition: 'transform 0.2s, color 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <ChevronRight size={32} />
          </button>

        </div>

        {/* Footer com Dots (Paginação) e Botão Final */}
        <div style={{
          padding: '1.2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.3)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          {/* Paginação */}
          <div style={{ display: 'flex', gap: '10px', paddingLeft: '1rem' }}>
            {features.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                style={{
                  width: activeTab === idx ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === idx ? 'var(--accent-color)' : 'rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out'
                }}
                aria-label={`Ir para o slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Botão Ação */}
          <button
            className="btn-action"
            onClick={activeTab === features.length - 1 ? onClose : nextSlide}
            style={{
              background: 'var(--accent-color)',
              color: '#0f172a',
              border: 'none',
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.9rem'
            }}
          >
            {activeTab === features.length - 1 ? 'Começar a Usar!' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;
