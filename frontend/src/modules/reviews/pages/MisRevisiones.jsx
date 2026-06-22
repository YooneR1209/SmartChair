import { useEffect, useState } from 'react';
import { reviews } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';
import { emit } from '../../../shared/services/events';

const C = {
  dark: '#1A1A2E',
  gold: '#9A6F00',
  goldLight: '#D4AC0D',
  goldBg: '#FEF9E7',
  red: '#C0392B',
  green: '#1E8449',
  blue: '#1565C0',
  orange: '#E67E22',
  bg: '#F5F7FA',
  border: '#E5E8EB',
  textSecondary: '#5D6D7E',
  textMuted: '#9CA3AF',
};

const VEREDICTOS = [
  { value: 'aceptado', icon: '✓', label: 'Aceptado', desc: 'La ponencia cumple con los criterios de calidad establecidos.' },
  { value: 'rechazado', icon: '✕', label: 'Rechazado', desc: 'La ponencia no cumple con los criterios mínimos requeridos.' },
  { value: 'aceptado_con_cambios', icon: '↻', label: 'Aceptado con cambios', desc: 'La ponencia requiere modificaciones antes de ser aceptada.' },
];

function MisRevisiones() {
  const { addToast } = useToast();
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewMode, setReviewMode] = useState(null);
  const [form, setForm] = useState({ veredicto: '', comentario_autor: '', comentario_privado: '', respuestas_rubrica: {} });

  const load = async () => {
    try {
      const data = await reviews.misAsignaciones();
      setAsignaciones(Array.isArray(data) ? data : []);
    } catch {
      setAsignaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const openComplete = (rev) => {
    setSelectedReview(rev);
    setReviewMode('complete');
    setForm({ veredicto: '', comentario_autor: '', comentario_privado: '', respuestas_rubrica: {} });
  };

  const openView = (rev) => {
    setSelectedReview(rev);
    setReviewMode('view');
  };

  const closeModal = () => {
    setSelectedReview(null);
    setReviewMode(null);
  };

  const handleSubmit = async () => {
    if (!form.veredicto || !form.comentario_autor) {
      addToast('Debes seleccionar un veredicto y escribir un comentario para el autor.', 'warning');
      return;
    }
    try {
      await reviews.completar(selectedReview.revision_id, form);
      closeModal();
      addToast('Revisión enviada correctamente', 'success');
      emit('review:completada');
      setLoading(true);
      await load();
    } catch (err) {
      addToast(err.message || 'Error al enviar la revisión', 'error');
    }
  };

  const pendientes = asignaciones.filter((r) => r.estado_revision !== 'completada').length;
  const completadas = asignaciones.filter((r) => r.estado_revision === 'completada').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ margin: '0 0 6px', color: C.textSecondary, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Inicio &gt; Mis Revisiones
        </p>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: C.dark }}>Mis Revisiones</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 20px', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: 36, height: 36, border: '3px solid ' + C.border, borderTopColor: C.goldLight, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: C.textSecondary, fontSize: '0.9rem', margin: 0 }}>Cargando revisiones...</p>
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      ) : asignaciones.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: '#fff', border: '1px solid ' + C.border, borderRadius: '16px', gap: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: C.textMuted }}>rate_review</span>
          <p style={{ color: C.textSecondary, fontSize: '1rem', fontWeight: 600, margin: 0 }}>No tienes revisiones asignadas.</p>
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Asignadas', value: asignaciones.length, color: C.dark, bg: '#F0F0F5', icon: 'assignment' },
              { label: 'Pendientes', value: pendientes, color: C.gold, bg: '#FEF9E7', icon: 'hourglass_empty' },
              { label: 'Completadas', value: completadas, color: C.green, bg: '#E8F5E9', icon: 'check_circle' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px',
                padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: stat.color }}>{stat.icon}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textSecondary }}>
                    {stat.label}
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: stat.color, lineHeight: 1.1 }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {asignaciones.map((rev) => (
              <div key={rev.id} style={{
                background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px',
                padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: rev.estado_revision === 'completada' ? 'rgba(30,132,73,0.1)' : C.goldBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span className="material-symbols-outlined" style={{
                          fontSize: '20px',
                          color: rev.estado_revision === 'completada' ? C.green : C.gold,
                        }}>
                          {rev.estado_revision === 'completada' ? 'check_circle' : 'rate_review'}
                        </span>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.dark }}>
                          {rev.titulo_ponencia || rev.titulo || 'Ponencia sin título'}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {rev.area_tematica && (
                            <span style={{
                              display: 'inline-flex', padding: '2px 10px', borderRadius: '999px',
                              fontSize: '0.7rem', fontWeight: 700, background: C.goldBg,
                              color: C.gold, border: '1px solid ' + C.goldLight,
                            }}>
                              {rev.area_tematica}
                            </span>
                          )}
                          {rev.conferencia && (
                            <span style={{ fontSize: '0.78rem', color: C.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: C.textMuted }}>event</span>
                              {rev.conferencia}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 14px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                    whiteSpace: 'nowrap', flexShrink: 0,
                    background: rev.estado_revision === 'completada' ? 'rgba(30,132,73,0.12)' : 'rgba(154,111,0,0.12)',
                    color: rev.estado_revision === 'completada' ? C.green : C.gold,
                  }}>
                    {rev.estado_revision === 'completada' ? 'Completada' : 'Pendiente'}
                  </span>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {rev.estado_revision === 'completada' ? (
                    <>
                      <button onClick={() => openView(rev)} style={{
                        padding: '8px 18px', background: 'transparent', color: C.dark,
                        border: '1px solid ' + C.border, borderRadius: '8px', fontWeight: 600,
                        fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dark; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                        Ver Detalle
                      </button>
                      {rev.veredicto && (
                        <span style={{ fontSize: '0.82rem', color: C.textSecondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                            background: rev.veredicto === 'aceptado' ? 'rgba(30,132,73,0.1)' : rev.veredicto === 'rechazado' ? 'rgba(192,57,43,0.08)' : C.goldBg,
                            color: rev.veredicto === 'aceptado' ? C.green : rev.veredicto === 'rechazado' ? C.red : C.gold,
                          }}>
                            {rev.veredicto.replace(/_/g, ' ')}
                          </span>
                        </span>
                      )}
                    </>
                  ) : (
                    <button onClick={() => openComplete(rev)} style={{
                      padding: '10px 22px', background: C.goldLight, color: '#fff',
                      border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#B8892E'}
                      onMouseLeave={(e) => e.currentTarget.style.background = C.goldLight}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_note</span>
                      Iniciar Revisión
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {(reviewMode === 'complete' || reviewMode === 'view') && selectedReview && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          background: 'rgba(0,0,0,0.35)',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '32px', width: '100%',
            maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
          }}>
            {reviewMode === 'complete' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.gold }}>rate_review</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: C.dark }}>Revisión de Ponencia</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: C.bg, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textMuted }}>Título</span>
                      <p style={{ margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 600, color: C.dark }}>
                        {selectedReview.titulo_ponencia || selectedReview.titulo || 'Ponencia sin título'}
                      </p>
                    </div>
                    {selectedReview.resumen && (
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textMuted }}>Resumen</span>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: C.textSecondary, lineHeight: 1.6 }}>
                          {selectedReview.resumen.length > 300 ? selectedReview.resumen.slice(0, 300) + '...' : selectedReview.resumen}
                        </p>
                      </div>
                    )}
                    {selectedReview.area_tematica && (
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textMuted }}>Área Temática</span>
                        <span style={{
                          display: 'inline-block', marginTop: '6px', padding: '2px 10px', borderRadius: '999px',
                          fontSize: '0.72rem', fontWeight: 700, background: C.goldBg,
                          color: C.gold, border: '1px solid ' + C.goldLight,
                        }}>
                          {selectedReview.area_tematica}
                        </span>
                      </div>
                    )}
                    {selectedReview.archivo && (
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textMuted }}>Documento</span>
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: C.red }}>picture_as_pdf</span>
                          <a href={selectedReview.archivo} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.85rem', color: C.gold, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                            Ver PDF
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: C.dark, marginBottom: '10px' }}>
                      Veredicto <span style={{ color: C.red }}>*</span>
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {VEREDICTOS.map((v) => (
                        <div key={v.value} onClick={() => setForm({ ...form, veredicto: v.value })} style={{
                          flex: 1, padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                          textAlign: 'center', transition: 'all 0.2s',
                          border: '2px solid ' + (form.veredicto === v.value ? C.goldLight : C.border),
                          background: form.veredicto === v.value ? C.goldBg : '#fff',
                        }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem',
                            background: form.veredicto === v.value ? C.goldLight : C.bg,
                            color: form.veredicto === v.value ? '#fff' : C.textSecondary,
                          }}>
                            {v.icon}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.dark }}>{v.label}</span>
                          <span style={{ fontSize: '0.65rem', color: C.textMuted, lineHeight: 1.3 }}>{v.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>
                      Comentario para el autor <span style={{ color: C.red }}>*</span>
                    </label>
                    <textarea value={form.comentario_autor} onChange={(e) => setForm({ ...form, comentario_autor: e.target.value })}
                      rows={4} placeholder="Escribe tu retroalimentación anónima para el autor..."
                      style={{
                        width: '100%', border: '1.5px solid ' + C.border, borderRadius: '10px', padding: '12px 14px',
                        fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        fontFamily: 'inherit', color: C.dark, transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = C.goldLight}
                      onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>
                      Notas privadas para el organizador
                    </label>
                    <textarea value={form.comentario_privado} onChange={(e) => setForm({ ...form, comentario_privado: e.target.value })}
                      rows={3} placeholder="Estas notas no serán visibles para el autor..."
                      style={{
                        width: '100%', border: '1.5px solid ' + C.border, borderRadius: '10px', padding: '12px 14px',
                        fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        fontFamily: 'inherit', color: C.dark, transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = C.goldLight}
                      onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button onClick={closeModal}
                      style={{
                        padding: '10px 22px', background: '#fff', color: C.dark,
                        border: '1px solid ' + C.border, borderRadius: '10px', fontWeight: 600,
                        cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.textMuted; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                    >
                      Cancelar
                    </button>
                    <button onClick={handleSubmit}
                      style={{
                        padding: '10px 22px', background: C.goldLight, color: '#fff',
                        border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
                        fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#B8892E'}
                      onMouseLeave={(e) => e.currentTarget.style.background = C.goldLight}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
                      Enviar Revisión
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(30,132,73,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.green }}>check_circle</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: C.dark }}>Detalle de Revisión</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: C.bg, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textMuted }}>Ponencia</span>
                      <p style={{ margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 600, color: C.dark }}>
                        {selectedReview.titulo_ponencia || selectedReview.titulo || 'Ponencia sin título'}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textMuted }}>Veredicto</span>
                      <span style={{
                        display: 'inline-block', marginTop: '6px', padding: '4px 12px', borderRadius: '8px',
                        fontSize: '0.85rem', fontWeight: 700,
                        background: selectedReview.veredicto === 'aceptado' ? 'rgba(30,132,73,0.1)' :
                          selectedReview.veredicto === 'rechazado' ? 'rgba(192,57,43,0.08)' : C.goldBg,
                        color: selectedReview.veredicto === 'aceptado' ? C.green :
                          selectedReview.veredicto === 'rechazado' ? C.red : C.gold,
                      }}>
                        {selectedReview.veredicto ? selectedReview.veredicto.replace(/_/g, ' ') : '—'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textMuted }}>Comentario para el autor</span>
                    <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: C.dark, lineHeight: 1.6, background: C.bg, borderRadius: '10px', padding: '14px' }}>
                      {selectedReview.comentario_autor || '—'}
                    </p>
                  </div>

                  {selectedReview.comentario_privado && (
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textMuted }}>Notas privadas para el organizador</span>
                      <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: C.textSecondary, lineHeight: 1.6, background: C.goldBg, borderRadius: '10px', padding: '14px' }}>
                        {selectedReview.comentario_privado}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button onClick={closeModal}
                      style={{
                        padding: '10px 22px', background: C.dark, color: '#fff', border: 'none',
                        borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2C3E50'}
                      onMouseLeave={(e) => e.currentTarget.style.background = C.dark}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MisRevisiones;
