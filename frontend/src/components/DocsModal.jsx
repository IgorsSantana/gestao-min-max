import React, { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, X, ChevronLeft, ChevronRight, List } from 'lucide-react';
import docsMarkdownRaw from '../../../DOCUMENTACAO_SISTEMA.md?raw';

const DocsModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Split markdown by horizontal rule '---' and extract titles
  const pages = useMemo(() => {
    const rawPages = docsMarkdownRaw.split(/\n---\n/).map(p => p.trim()).filter(Boolean);
    return rawPages.map((page, idx) => {
      const titleMatch = page.match(/^#+\s+(.*)/m);
      return {
        id: idx,
        title: titleMatch ? titleMatch[1].replace(/[:*]/g, '').trim() : `Seção ${idx + 1}`,
        content: page
      };
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentPage(0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const nextSlide = () => {
    if (currentPage < pages.length - 1) setCurrentPage(p => p + 1);
  };

  const prevSlide = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
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
        width: '95%',
        maxWidth: '1100px',
        minHeight: '650px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Header do Modal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.2rem 1.8rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(90deg, rgba(15,23,42,1) 0%, rgba(30,58,138,0.3) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={20} className="text-accent" />
            <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Documentação Oficial
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal (Sidebar + Conteúdo) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Sidebar / Marcadores */}
          <div className="custom-scrollbar" style={{
            width: '280px',
            background: 'rgba(0,0,0,0.2)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            padding: '1.5rem 0',
            overflowY: 'auto',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 1.5rem', marginBottom: '1.2rem' }}>
              <List size={16} color="var(--text-secondary)" />
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0, letterSpacing: '1px' }}>Índice</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pages.map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  style={{
                    background: currentPage === idx ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    color: currentPage === idx ? 'var(--accent-color)' : 'var(--text-secondary)',
                    border: 'none',
                    borderLeft: currentPage === idx ? '4px solid var(--accent-color)' : '4px solid transparent',
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: currentPage === idx ? '600' : 'normal',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={page.title}
                  onMouseOver={(e) => {
                    if (currentPage !== idx) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentPage !== idx) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {page.title}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo do Markdown */}
          <div className="docs-markdown-body custom-scrollbar" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.5rem 3.5rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.8',
            fontSize: '0.95rem',
            background: 'rgba(15, 23, 42, 0.4)'
          }}>
            <div className="animate-fade-in" key={currentPage}>
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 style={{ color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '2rem', fontSize: '1.8rem' }} {...props} />,
                  h2: ({node, ...props}) => <h2 style={{ color: 'var(--accent-color)', marginTop: '0', marginBottom: '1.2rem', fontSize: '1.4rem' }} {...props} />,
                  h3: ({node, ...props}) => <h3 style={{ color: 'var(--text-primary)', marginTop: '1.8rem', marginBottom: '0.8rem', fontSize: '1.1rem' }} {...props} />,
                  p: ({node, ...props}) => <p style={{ marginBottom: '1.2rem' }} {...props} />,
                  ul: ({node, ...props}) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }} {...props} />,
                  li: ({node, ...props}) => <li style={{ marginBottom: '0.6rem' }} {...props} />,
                  blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: '3px solid var(--accent-color)', background: 'rgba(56, 189, 248, 0.05)', padding: '1rem 1.5rem', margin: '1.5rem 0', borderRadius: '0 8px 8px 0', color: 'var(--text-primary)' }} {...props} />,
                  code: ({node, inline, ...props}) => {
                    if (inline) {
                      return <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.9em', border: '1px solid rgba(56,189,248,0.2)' }} {...props} />
                    }
                    return <code style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', color: 'var(--text-primary)', marginBottom: '1.5rem' }} {...props} />
                  },
                  strong: ({node, ...props}) => <strong style={{ color: 'var(--text-primary)', fontWeight: 'bold' }} {...props} />
                }}
              >
                {pages[currentPage].content}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Footer com Navegação */}
        <div style={{
          padding: '1.2rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.4)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          
          <button
            onClick={prevSlide}
            disabled={currentPage === 0}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: currentPage === 0 ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              visibility: currentPage === 0 ? 'hidden' : 'visible'
            }}
          >
            <ChevronLeft size={18} /> Seção Anterior
          </button>

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Seção {currentPage + 1} de {pages.length}
          </div>

          <button
            onClick={currentPage === pages.length - 1 ? onClose : nextSlide}
            style={{
              background: currentPage === pages.length - 1 ? 'var(--accent-color)' : 'transparent',
              color: currentPage === pages.length - 1 ? '#0f172a' : 'var(--text-secondary)',
              border: currentPage === pages.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              fontWeight: currentPage === pages.length - 1 ? 'bold' : 'normal',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {currentPage === pages.length - 1 ? 'Finalizar Leitura' : 'Próxima Seção'} {currentPage !== pages.length - 1 && <ChevronRight size={18} />}
          </button>

        </div>
      </div>
    </div>
  );
};

export default DocsModal;
