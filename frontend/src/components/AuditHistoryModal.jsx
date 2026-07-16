import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AuditHistoryModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/auditoria');
      setLogs(response.data);
    } catch (err) {
      console.error(err);
      setError("Falha ao carregar o histórico de auditoria.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '90%', padding: 0 }}>
        
        <div className="modal-header">
          <h3>
            <Clock size={24} /> Histórico de Alterações (Auditoria)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="btn-refresh-sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> Atualizar
            </button>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div className="loading-state main-loader" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p className="loader-text">Carregando trilha de auditoria...</p>
            </div>
          ) : error ? (
            <div className="error-state" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <AlertTriangle className="large-icon danger" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="custom-scrollbar" style={{ flex: 1 }}>
              {logs.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Nenhum registro de auditoria encontrado.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ background: 'rgba(30, 41, 59, 1)', color: 'var(--accent-color)' }}>
                      <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Data/Hora</th>
                      <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Usuário</th>
                      <th style={{ padding: '10px 15px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Loja</th>
                      <th style={{ padding: '10px 15px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Cod. Produto</th>
                      <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Campo Editado</th>
                      <th style={{ padding: '10px 15px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Valor Anterior</th>
                      <th style={{ padding: '10px 15px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Novo Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 15px', color: 'var(--text-secondary)' }}>{new Date(log.dataHora).toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '10px 15px', fontWeight: 'bold' }}>{log.usuario}</td>
                        <td style={{ padding: '10px 15px', textAlign: 'center' }}>{log.idEmpresa}</td>
                        <td style={{ padding: '10px 15px', textAlign: 'center' }}>{log.idSubProduto}</td>
                        <td style={{ padding: '10px 15px', color: '#10b981' }}>{log.campoAlterado}</td>
                        <td style={{ padding: '10px 15px', textAlign: 'center', color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>{log.valorAntigo}</td>
                        <td style={{ padding: '10px 15px', textAlign: 'center', color: 'white', fontWeight: 'bold' }}>{log.valorNovo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
