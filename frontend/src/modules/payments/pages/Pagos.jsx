import { useEffect, useState } from 'react';
import { payments } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';

const C = {
  dark: '#1A1A2E',
  gold: '#9A6F00',
  goldLight: '#D4AC0D',
  goldBg: '#FEF9E7',
  red: '#C0392B',
  green: '#1E8449',
  orange: '#E67E22',
  bg: '#F5F7FA',
  border: '#E5E8EB',
  textSecondary: '#5D6D7E',
  textMuted: '#9CA3AF',
  blue: '#1565C0',
};

const statusStyles = {
  'completado': { bg: '#E8F5E9', color: C.green },
  'completo': { bg: '#E8F5E9', color: C.green },
  'succeeded': { bg: '#E8F5E9', color: C.green },
  'Éxito': { bg: '#E8F5E9', color: C.green },
  'pendiente': { bg: '#FFF3E0', color: C.orange },
  'Pendiente': { bg: '#FFF3E0', color: C.orange },
  'reembolsado': { bg: C.bg, color: C.textSecondary },
  'Reembolsado': { bg: C.bg, color: C.textSecondary },
  'requires_payment_method': { bg: '#FFF3E0', color: C.orange },
  'processing': { bg: '#E3F2FD', color: C.dark },
};

function Pagos() {
  const { addToast } = useToast();
  const [paymentsList, setPaymentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecibo, setShowRecibo] = useState(null);
  const [reciboLoading, setReciboLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setError('');
      try {
        const data = await payments.listar();
        setPaymentsList(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        addToast(err.message, 'error');
        setPaymentsList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleVerRecibo = async (pagoId) => {
    setReciboLoading(true);
    try {
      const data = await payments.recibo(pagoId);
      setShowRecibo(data);
    } catch (err) {
      addToast(err.message || 'Error al cargar recibo', 'error');
    } finally {
      setReciboLoading(false);
    }
  };

  const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ margin: '0 0 6px', color: C.textSecondary, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Dashboard › Pagos
        </p>
        <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: C.dark }}>Pagos</h1>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid ' + C.border, borderTopColor: C.goldLight, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: C.textSecondary, fontSize: '14px', margin: 0 }}>Cargando pagos...</p>
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      )}

      {!loading && paymentsList.length === 0 && !error && (
        <div style={{ padding: '60px', textAlign: 'center', background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: C.textMuted }}>payments</span>
          <p style={{ color: C.textSecondary, fontSize: '1rem', fontWeight: 600, margin: '12px 0 0' }}>No hay pagos registrados.</p>
        </div>
      )}

      {paymentsList.length > 0 && (
        <div className="table-scroll" style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid ' + C.border, background: C.bg }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: C.textSecondary }}>Monto</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: C.textSecondary }}>Moneda</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: C.textSecondary }}>Motivo</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: C.textSecondary }}>Estado</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: C.textSecondary }}>Fecha</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: C.textSecondary }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {paymentsList.map((p, i) => {
                const estado = p.estado || 'Pendiente';
                const style = statusStyles[estado] || statusStyles['Pendiente'];
                const isCompleted = estado === 'completado' || estado === 'completo' || estado === 'succeeded' || estado === 'Éxito';
                return (
                  <tr key={p.id || i} style={{ borderBottom: '1px solid ' + C.border, transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 700, color: C.dark }}>
                      {p.monto != null ? `$${Number(p.monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: C.textSecondary }}>{p.moneda || 'USD'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: C.textSecondary }}>
                      {p.motivo || p.referencia_tipo || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: style.bg, color: style.color }}>
                        {estado}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: C.textSecondary }}>{formatDate(p.creado_en || p.fecha || p.created_at)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {isCompleted && (
                        <button onClick={() => handleVerRecibo(p.id)} style={{
                          padding: '6px 14px', background: C.bg, border: '1px solid ' + C.border,
                          borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                          color: C.dark, display: 'flex', alignItems: 'center', gap: '6px',
                          transition: 'all 0.15s',
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.goldLight; e.currentTarget.style.color = C.gold; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dark; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>receipt_long</span>
                          Ver Recibo
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showRecibo && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          background: 'rgba(0,0,0,0.35)',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowRecibo(null); }}
        >
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '36px', width: '100%',
            maxWidth: '500px', boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(30,132,73,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: C.green }}>receipt_long</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: C.dark }}>Recibo de Pago</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: C.textMuted }}>{showRecibo.recibo_numero}</p>
                </div>
              </div>
              <button onClick={() => setShowRecibo(null)} style={{
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                background: C.bg, cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: C.textMuted, transition: 'all 0.15s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.border}
                onMouseLeave={(e) => e.currentTarget.style.background = C.bg}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #1A1A2E 0%, #2C3E50 100%)',
              borderRadius: '14px', padding: '24px', marginBottom: '20px',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  ${Number(showRecibo.monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginTop: '4px' }}>
                  {showRecibo.moneda || 'USD'}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span style={{
                  padding: '4px 16px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                  background: 'rgba(30,132,73,0.2)', color: '#4CAF50',
                }}>
                  {showRecibo.estado}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid ' + C.bg }}>
                <span style={{ color: C.textMuted }}>Usuario</span>
                <span style={{ fontWeight: 600, color: C.dark, textAlign: 'right' }}>{showRecibo.usuario_nombre}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid ' + C.bg }}>
                <span style={{ color: C.textMuted }}>Email</span>
                <span style={{ fontWeight: 600, color: C.dark, textAlign: 'right' }}>{showRecibo.usuario_email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid ' + C.bg }}>
                <span style={{ color: C.textMuted }}>Fecha</span>
                <span style={{ fontWeight: 600, color: C.dark, textAlign: 'right' }}>{formatDate(showRecibo.fecha)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid ' + C.bg }}>
                <span style={{ color: C.textMuted }}>N° Recibo</span>
                <span style={{ fontWeight: 600, color: C.dark, textAlign: 'right' }}>{showRecibo.recibo_numero}</span>
              </div>
              {showRecibo.referencia_tipo && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.textMuted }}>Referencia</span>
                  <span style={{ fontWeight: 600, color: C.dark, textAlign: 'right' }}>
                    {showRecibo.referencia_tipo} #{showRecibo.referencia_id || ''}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid ' + C.border, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: C.textMuted }}>
                SmartChair — Sistema de Gestión de Conferencias
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pagos;
