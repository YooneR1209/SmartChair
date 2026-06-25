import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { conferencias } from '../../../shared/services/api';
import CreateConferenceModal from '../components/CreateConferenceModal';
import { useToast } from '../../../shared/components/ToastContext';
import { emit, on } from '../../../shared/services/events';

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

function Conferencias() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editConference, setEditConference] = useState(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState(null);
  const [cloneTarget, setCloneTarget] = useState(null);
  const [cloneName, setCloneName] = useState('');
  const [cloneInicio, setCloneInicio] = useState('');
  const [cloneFin, setCloneFin] = useState('');
  const [cloneLoading, setCloneLoading] = useState(false);
  const profileRaw = localStorage.getItem('profile');
  const profile = profileRaw ? JSON.parse(profileRaw) : null;
  const userRole = (localStorage.getItem('selectedRole') || profile?.rol || '').toUpperCase();
  const isOrganizer = userRole === 'ORGANIZADOR' || userRole === 'ADMINISTRADOR';

  const fetchList = async () => {
    try {
      const data = await conferencias.listar();
      setList(Array.isArray(data) ? data : []);
    } catch { setList([]); }
  };

  useEffect(() => {
    setLoading(true);
    fetchList().finally(() => setLoading(false));
    const interval = setInterval(fetchList, 30000);
    const onFocus = () => fetchList();
    window.addEventListener('focus', onFocus);
    const unsub = on('conferencia:actualizada', fetchList);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      unsub();
    };
  }, []);

  const handleDelete = async (slug) => {
    try {
      await conferencias.eliminar(slug);
      setConfirmDeleteSlug(null);
      setList((prev) => prev.filter((c) => c.slug !== slug));
      addToast('Conferencia eliminada', 'success');
      emit('conferencia:actualizada');
    } catch (err) { addToast(err.message || 'Error al eliminar', 'error'); }
  };

  const openCloneModal = (conf) => {
    setCloneTarget(conf);
    setCloneName(`${conf.nombre} (Copia)`);
    setCloneInicio(conf.fecha_inicio || '');
    setCloneFin(conf.fecha_fin || '');
  };

  const handleCloneSubmit = async () => {
    if (!cloneName.trim()) { addToast('El nombre es obligatorio', 'warning'); return; }
    if (cloneInicio && cloneFin && new Date(cloneFin) < new Date(cloneInicio)) {
      addToast('La fecha de fin no puede ser anterior a la de inicio', 'warning');
      return;
    }
    setCloneLoading(true);
    try {
      const data = { nombre: cloneName.trim() };
      if (cloneInicio) data.fecha_inicio = cloneInicio;
      if (cloneFin) data.fecha_fin = cloneFin;
      await conferencias.clonar(cloneTarget.slug, data);
      await fetchList();
      setCloneTarget(null);
      addToast('Conferencia clonada correctamente', 'success');
      emit('conferencia:actualizada');
    } catch (err) {
      addToast(err.message || 'Error al clonar', 'error');
    } finally {
      setCloneLoading(false);
    }
  };

  const handleSaved = async () => {
    setShowCreateModal(false);
    setEditConference(null);
    await fetchList();
    emit('conferencia:actualizada');
  };

  const formatDate = (val) => {
    if (!val) return '\u2014';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  };

  const getEstadoStyle = (estado) => {
    const map = {
      abierta: { bg: '#E8F5E9', color: '#1E8449', label: 'Abierta', icon: 'check_circle' },
      activa: { bg: '#E8F5E9', color: '#1E8449', label: 'Activa', icon: 'check_circle' },
      cerrada: { bg: '#FDEDEC', color: '#C0392B', label: 'Cerrada', icon: 'cancel' },
      borrador: { bg: '#F0F0F0', color: '#5D6D7E', label: 'Borrador', icon: 'edit_note' },
      en_revision: { bg: '#FEF9E7', color: '#9A6F00', label: 'En Revisión', icon: 'rate_review' },
      archivada: { bg: '#E8E8E8', color: '#4A4A4A', label: 'Archivada', icon: 'archive' },
    };
    return map[estado] || { bg: '#F0F0F0', color: '#5D6D7E', label: estado, icon: 'help_outline' };
  };

  const getDaysRemaining = (conf) => {
    if (!conf.fecha_fin) return null;
    const now = new Date();
    const end = new Date(conf.fecha_fin);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: 'Finalizada', color: C.red };
    if (diff === 0) return { text: 'Hoy', color: C.gold };
    return { text: `Faltan ${diff} días`, color: C.textMuted };
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: C.textMuted, marginBottom: '6px' }}>
            Dashboard &gt; Conferencias
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: C.dark, margin: 0 }}>Conferencias</h1>
          <p style={{ fontSize: '13px', color: C.textMuted, margin: '4px 0 0' }}>
            {list.length} conferencia{list.length !== 1 ? 's' : ''} disponible{list.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isOrganizer && (
          <button onClick={() => { setEditConference(null); setShowCreateModal(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', background: C.dark, color: '#fff',
              border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2C3E50'}
            onMouseLeave={(e) => e.currentTarget.style.background = C.dark}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nueva Conferencia
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px 20px', flexDirection: 'column', gap: '16px',
        }}>
          <div style={{
            width: 40, height: 40, border: '3px solid ' + C.border,
            borderTopColor: C.goldLight, borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: C.textSecondary, fontSize: '14px', margin: 0 }}>Cargando conferencias...</p>
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      ) : list.length === 0 ? (
        /* Empty state */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '80px 48px', background: '#fff', border: '1px solid ' + C.border,
          borderRadius: '16px', gap: '16px',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px', background: C.goldBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: C.gold }}>groups</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.textSecondary, fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
              No hay conferencias disponibles
            </p>
            <p style={{ color: C.textMuted, fontSize: '13px', margin: 0 }}>
              {isOrganizer
                ? 'Crea una nueva conferencia para comenzar.'
                : 'No hay conferencias activas en este momento.'}
            </p>
          </div>
        </div>
      ) : (
        /* Conference grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '16px',
        }}>
          {list.map((conf) => {
            const st = getEstadoStyle(conf.estado);
            const days = getDaysRemaining(conf);
            const esPaga = conf.es_de_pago && conf.monto_inscripcion;
            return (
              <div key={conf.id || conf.slug} style={{
                background: '#fff', border: '1px solid ' + C.border, borderRadius: '16px',
                overflow: 'hidden', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Top color bar */}
                <div style={{ height: '4px', background: `linear-gradient(90deg, ${st.color}, ${st.color}88)` }} />

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px', background: st.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: st.color }}>{st.icon}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          margin: '0 0 3px', fontSize: '16px', fontWeight: 700, color: C.dark,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                          onClick={() => navigate(`/conferencias/${conf.slug}`)}
                          onMouseEnter={(e) => e.currentTarget.style.color = C.gold}
                          onMouseLeave={(e) => e.currentTarget.style.color = C.dark}
                        >
                          {conf.nombre}
                        </h3>
                        {conf.lugar && (
                          <p style={{ margin: 0, fontSize: '12px', color: C.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span>
                            {conf.lugar}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                        background: st.bg, color: st.color, border: '1px solid ' + st.color + '22',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                        {st.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {conf.descripcion && (
                    <p style={{
                      margin: 0, fontSize: '13px', color: C.textSecondary, lineHeight: 1.6,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {conf.descripcion}
                    </p>
                  )}

                  {/* Areas */}
                  {conf.areas_tematicas && conf.areas_tematicas.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {conf.areas_tematicas.slice(0, 3).map((area) => (
                        <span key={area} style={{
                          fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                          background: C.bg, color: C.textSecondary,
                        }}>
                          {area}
                        </span>
                      ))}
                      {conf.areas_tematicas.length > 3 && (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: C.textMuted }}>
                          +{conf.areas_tematicas.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Dates row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: C.bg, borderRadius: '10px', gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.textSecondary }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: C.textMuted }}>calendar_month</span>
                      <span style={{ fontWeight: 600 }}>{formatDate(conf.fecha_inicio)}</span>
                      <span style={{ color: C.textMuted }}>—</span>
                      <span style={{ fontWeight: 600 }}>{formatDate(conf.fecha_fin)}</span>
                    </div>
                    {days && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: days.color, whiteSpace: 'nowrap' }}>
                        {days.text}
                      </span>
                    )}
                  </div>

                  {/* Price badge */}
                  {esPaga && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start',
                      padding: '4px 12px', borderRadius: '8px',
                      background: 'rgba(212,172,13,0.1)', color: C.gold,
                      fontSize: '13px', fontWeight: 700,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
                      ${Number(conf.monto_inscripcion).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                    </div>
                  )}

                  {/* Spacer */}
                  <div style={{ flex: 1 }} />

                  {/* Actions */}
                  <div style={{
                    display: 'flex', gap: '8px', flexWrap: 'wrap',
                    paddingTop: '14px', borderTop: '1px solid ' + C.bg,
                  }}>
                    <button onClick={() => navigate(`/conferencias/${conf.slug}`)}
                      style={{
                        flex: 1, padding: '8px 14px', background: C.dark, color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '5px', transition: 'background 0.15s',
                        minWidth: 0,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2C3E50'}
                      onMouseLeave={(e) => e.currentTarget.style.background = C.dark}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span>
                      Ver Detalle
                    </button>
                    {(conf.estado === 'abierta' || conf.estado === 'activa') && (
                      <button onClick={() => navigate(`/conferencias/${conf.slug}`)}
                        style={{
                          padding: '8px 14px', background: C.goldLight, color: '#fff',
                          border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#B8892E'}
                        onMouseLeave={(e) => e.currentTarget.style.background = C.goldLight}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>login</span>
                        Participar
                      </button>
                    )}
                    {isOrganizer && (
                      <>
                        <button onClick={() => { setEditConference(conf); setShowCreateModal(true); }}
                          style={{
                            padding: '8px 10px', background: '#fff', color: C.dark,
                            border: '1px solid ' + C.border, borderRadius: '8px', fontSize: '12px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dark; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                        </button>
                        <button onClick={() => openCloneModal(conf)}
                          style={{
                            padding: '8px 12px', background: '#fff', color: C.blue,
                            border: '1px solid ' + C.border, borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.background = '#F0F7FF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = '#fff'; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_copy</span>
                          Clonar
                        </button>
                        <button onClick={() => setConfirmDeleteSlug(conf.slug)}
                          style={{
                            padding: '8px 10px', background: 'transparent', color: C.red,
                            border: '1px solid transparent', borderRadius: '8px', fontSize: '12px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#FDEDEC'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateConferenceModal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setEditConference(null); }}
          conference={editConference}
          onSaved={handleSaved}
        />
      )}

      {/* Clone Modal */}
      {cloneTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(0,0,0,0.35)',
          animation: 'fadeIn 0.2s ease-out',
        }}
          onClick={(e) => { if (e.target === e.currentTarget && !cloneLoading) setCloneTarget(null); }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '32px', width: '100%',
            maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.25s ease-out',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(21,101,192,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: C.blue }}>content_copy</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: C.dark }}>Clonar Conferencia</h2>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: C.textMuted }}>
                  Crearás una copia de <strong>{cloneTarget.nombre}</strong>
                </p>
              </div>
            </div>

            {/* Original info card */}
            <div style={{
              padding: '14px 16px', borderRadius: '12px', background: C.bg,
              border: '1px solid ' + C.border, marginBottom: '24px',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textMuted }}>
                Conferencia Original
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#fff', border: '1px solid ' + C.border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '12px', color: C.dark, flexShrink: 0,
                }}>
                  {getInitials(cloneTarget.nombre)}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: C.dark }}>{cloneTarget.nombre}</div>
                  <div style={{ fontSize: '12px', color: C.textMuted, display: 'flex', gap: '12px' }}>
                    <span>{formatDate(cloneTarget.fecha_inicio)} — {formatDate(cloneTarget.fecha_fin)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '13px', fontWeight: 700, color: C.dark, marginBottom: '6px',
                }}>
                  Nombre de la copia <span style={{ color: C.red }}>*</span>
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Nombre de la nueva conferencia"
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: '14px', boxSizing: 'border-box',
                    border: '1.5px solid ' + C.border, borderRadius: '10px', outline: 'none',
                    color: C.dark, background: '#fff', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.blue}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={cloneInicio}
                    onChange={(e) => setCloneInicio(e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px', fontSize: '13px', boxSizing: 'border-box',
                      border: '1.5px solid ' + C.border, borderRadius: '10px', outline: 'none',
                      color: C.dark, background: '#fff', fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = C.blue}
                    onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={cloneFin}
                    onChange={(e) => setCloneFin(e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px', fontSize: '13px', boxSizing: 'border-box',
                      border: '1.5px solid ' + C.border, borderRadius: '10px', outline: 'none',
                      color: C.dark, background: '#fff', fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = C.blue}
                    onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                  />
                </div>
              </div>
            </div>

            {/* Info notice */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(21,101,192,0.06)',
              border: '1px solid rgba(21,101,192,0.12)',
              marginTop: '20px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: C.blue, flexShrink: 0, marginTop: '1px' }}>info</span>
              <p style={{ margin: 0, fontSize: '12px', color: C.blue, lineHeight: 1.5 }}>
                La conferencia se creará en estado <strong>Borrador</strong> y quedarás como organizador.
                Todos los campos de configuración (áreas temáticas, rúbrica, formulario, etc.) se copiarán de la original.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid ' + C.bg }}>
              <button
                onClick={() => setCloneTarget(null)}
                disabled={cloneLoading}
                style={{
                  padding: '11px 22px', background: '#fff', color: C.dark,
                  border: '1px solid ' + C.border, borderRadius: '10px', fontWeight: 600,
                  cursor: cloneLoading ? 'not-allowed' : 'pointer', fontSize: '14px',
                  opacity: cloneLoading ? 0.5 : 1, transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!cloneLoading) e.currentTarget.style.borderColor = C.textMuted; }}
                onMouseLeave={(e) => { if (!cloneLoading) e.currentTarget.style.borderColor = C.border; }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCloneSubmit}
                disabled={cloneLoading || !cloneName.trim()}
                style={{
                  padding: '11px 24px', background: C.blue, color: '#fff',
                  border: 'none', borderRadius: '10px', fontWeight: 700,
                  cursor: (cloneLoading || !cloneName.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: (cloneLoading || !cloneName.trim()) ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!cloneLoading && cloneName.trim()) e.currentTarget.style.background = '#0D47A1'; }}
                onMouseLeave={(e) => { if (!cloneLoading) e.currentTarget.style.background = C.blue; }}
              >
                {cloneLoading ? (
                  <>
                    <div style={{
                      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                    }} />
                    Clonando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
                    Clonar Conferencia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteSlug && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          background: 'rgba(0,0,0,0.35)',
        }} onClick={() => setConfirmDeleteSlug(null)}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.2s ease-out',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: '#FDEDEC', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: C.red }}>delete_forever</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: C.dark }}>Eliminar conferencia</h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: C.textMuted }}>
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: C.textSecondary, lineHeight: 1.6 }}>
              ¿Estás seguro de eliminar esta conferencia? Se eliminarán todas las postulaciones, revisiones y datos asociados.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteSlug(null)}
                style={{
                  padding: '10px 20px', border: '1px solid ' + C.border, borderRadius: '10px',
                  background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px',
                  color: C.dark, transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = C.textMuted}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
              >
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDeleteSlug)}
                style={{
                  padding: '10px 20px', border: 'none', borderRadius: '10px',
                  background: C.red, color: '#fff', fontWeight: 700, cursor: 'pointer',
                  fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#A93226'}
                onMouseLeave={(e) => e.currentTarget.style.background = C.red}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Conferencias;