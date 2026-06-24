import { useEffect, useState } from 'react';
import { conferencias, reviews } from '../../../shared/services/api';
import AssignReviewersModal from '../../../shared/components/AssignReviewersModal';
import { useToast } from '../../../shared/components/ToastContext';

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

const ESTADO_MAP = {
  postulada: { bg: '#E3F2FD', text: C.blue, label: 'Postulada', icon: 'description' },
  en_revision: { bg: '#FFF3E0', text: C.orange, label: 'En Revisión', icon: 'rate_review' },
  aceptada: { bg: '#E8F5E9', text: C.green, label: 'Aceptada', icon: 'check_circle' },
  rechazada: { bg: '#FDEDEC', text: C.red, label: 'Rechazada', icon: 'cancel' },
  aceptada_con_cambios: { bg: '#FEF9E7', text: C.gold, label: 'Acept. con Cambios', icon: 'edit_note' },
  cambios_enviados: { bg: '#E3F2FD', text: C.blue, label: 'Cambios Enviados', icon: 'send' },
};

function GestionarPostulaciones() {
  const { addToast } = useToast();
  const [confList, setConfList] = useState([]);
  const [selectedConf, setSelectedConf] = useState(null);
  const [ponencias, setPonencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPon, setLoadingPon] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPon, setSelectedPon] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await conferencias.listar();
        setConfList(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedConf(data[0]);
        }
      } catch { setConfList([]); }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedConf) { setPonencias([]); return; }
    let active = true;
    const load = async () => {
      try {
        const data = await conferencias.listarPonencias(selectedConf.slug);
        if (active) setPonencias(Array.isArray(data) ? data : []);
      } catch { if (active) setPonencias([]); }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [selectedConf]);

  const filtered = ponencias.filter(p =>
    !search || p.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    p.area_tematica?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total', value: ponencias.length, color: C.dark, bg: '#F0F0F5', icon: 'description' },
    { label: 'En Revisión', value: ponencias.filter(p => p.estado === 'en_revision').length, color: C.orange, bg: '#FFF3E0', icon: 'rate_review' },
    { label: 'Aceptadas', value: ponencias.filter(p => p.estado === 'aceptada').length, color: C.green, bg: '#E8F5E9', icon: 'check_circle' },
    { label: 'Rechazadas', value: ponencias.filter(p => p.estado === 'rechazada').length, color: C.red, bg: '#FDEDEC', icon: 'cancel' },
  ];

  const handleAsignarAuto = async (ponenciaId) => {
    try {
      await reviews.asignarAutomatico(ponenciaId);
      addToast('Revisores asignados automáticamente', 'success');
      const data = await conferencias.listarPonencias(selectedConf.slug);
      setPonencias(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Error al asignar', 'error');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: 40, height: 40, border: '3px solid ' + C.border, borderTopColor: C.goldLight, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: C.textSecondary, fontSize: '14px', margin: 0 }}>Cargando conferencias...</p>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ margin: '0 0 6px', color: C.textSecondary, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Dashboard &gt; Gestionar Postulaciones
        </p>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: C.dark }}>Gestionar Postulaciones</h1>
      </div>

      {confList.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid ' + C.border }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: C.textMuted }}>event_busy</span>
          <p style={{ color: C.textSecondary, fontSize: '15px', fontWeight: 600, margin: '12px 0 0' }}>No hay conferencias disponibles.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid ' + C.border }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.textSecondary }}>event</span>
            <label style={{ fontSize: '14px', fontWeight: 600, color: C.dark }}>Conferencia:</label>
            <select
              value={selectedConf?.slug || ''}
              onChange={(e) => setSelectedConf(confList.find(c => c.slug === e.target.value) || null)}
              style={{
                flex: 1, minWidth: '250px', height: '44px', borderRadius: '10px', padding: '0 14px',
                fontSize: '14px', border: '1.5px solid ' + C.border, outline: 'none', background: C.bg, color: C.dark, fontWeight: 500, cursor: 'pointer',
              }}
            >
              {confList.map((c) => (
                <option key={c.slug} value={c.slug}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {loadingPon ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, border: '3px solid ' + C.border, borderTopColor: C.goldLight, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: C.textSecondary, fontSize: '14px', margin: 0 }}>Cargando postulaciones...</p>
            </div>
          ) : (
            <>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {stats.map((stat) => (
                  <div key={stat.label} style={{
                    background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px',
                    padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'default',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', background: stat.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '22px', color: stat.color }}>{stat.icon}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textSecondary }}>
                        {stat.label}
                      </span>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, lineHeight: 1.1 }}>{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid ' + C.border, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: C.textSecondary }}>description</span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: C.dark }}>
                      Postulaciones <span style={{ color: C.textMuted, fontWeight: 400 }}>({ponencias.length})</span>
                    </h3>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: C.textMuted }}>search</span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por título o área..."
                      style={{
                        height: '40px', width: '260px', borderRadius: '10px', padding: '0 14px 0 38px',
                        fontSize: '13px', border: '1.5px solid ' + C.border, outline: 'none', background: C.bg, color: C.dark,
                      }}
                    />
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: C.textMuted }}>inbox</span>
                    <p style={{ color: C.textMuted, fontSize: '14px', margin: '12px 0 0' }}>
                      {search ? 'No se encontraron postulaciones con ese filtro.' : 'No hay postulaciones en esta conferencia.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filtered.map((p, idx) => {
                      const es = ESTADO_MAP[p.estado] || { bg: '#F0F0F0', text: C.textSecondary, label: p.estado || 'desconocido', icon: 'help_outline' };
                      return (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '16px 24px', borderBottom: idx < filtered.length - 1 ? '1px solid ' + C.bg : 'none',
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '10px', background: es.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: es.text }}>{es.icon}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: C.dark, marginBottom: '3px' }}>{p.titulo}</div>
                            <div style={{ fontSize: '12px', color: C.textMuted, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span>{p.area_tematica}</span>
                              <span>•</span>
                              <span>Autor: {p.autor_nombre || p.autor_principal?.nombre_completo || '—'}</span>
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                            background: es.bg, color: es.text, whiteSpace: 'nowrap',
                          }}>
                            {es.label}
                          </span>
                          <button onClick={() => handleAsignarAuto(p.id)}
                            style={{
                              padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                              border: '1px solid ' + C.border, background: '#FFF', color: C.dark,
                              cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.goldLight; e.currentTarget.style.color = C.gold; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dark; }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_awesome</span>
                            Asignar Auto
                          </button>
                          <button onClick={() => { setSelectedPon(p); setShowModal(true); }}
                            style={{
                              padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                              border: 'none', background: C.goldLight, color: '#FFF',
                              cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#B8892E'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = C.goldLight; }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>manage_accounts</span>
                            Gestionar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {showModal && selectedPon && selectedConf && (
        <AssignReviewersModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setSelectedPon(null); }}
          ponencia={selectedPon}
          conferenceSlug={selectedConf.slug}
          onAssigned={async () => {
            setShowModal(false);
            setSelectedPon(null);
            const data = await conferencias.listarPonencias(selectedConf.slug);
            setPonencias(Array.isArray(data) ? data : []);
          }}
        />
      )}
    </div>
  );
}

export default GestionarPostulaciones;
