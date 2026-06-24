import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import PostularModal from '../components/PostularModal';
import { postulaciones, conferencias, reviews } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';
import { emit, on } from '../../../shared/services/events';
import { STATUS_MAP, normalizeStatus, Stepper } from '../../../shared/utils/statusMap.jsx';

const ITEMS_PER_PAGE = 6;

function MisPonencias() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [confOptions, setConfOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterConf, setFilterConf] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [page, setPage] = useState(1);

  const [resubmitPonenciaId, setResubmitPonenciaId] = useState(null);
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);

  const [feedbackPonencia, setFeedbackPonencia] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const load = async () => {
    try {
      const [subData, confData] = await Promise.all([
        postulaciones.misPostulaciones().catch(() => []),
        conferencias.listar().catch(() => []),
      ]);
      setList(Array.isArray(subData) ? subData : []);
      setConfOptions(Array.isArray(confData) ? confData : []);
    } catch { setList([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    const unsub1 = on('ponencia:actualizada', load);
    const unsub2 = on('review:completada', load);
    return () => { clearInterval(interval); unsub1(); unsub2(); };
  }, []);

  const uniqueAreas = [...new Set(list.map((s) => s.area_tematica).filter(Boolean))];

  const filtered = list.filter((s) => {
    if (search && !(s.titulo || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterEstado) {
      const normalizedFilter = normalizeStatus(filterEstado);
      const normalizedItem = normalizeStatus(s.estado);
      if (normalizedItem !== normalizedFilter) return false;
    }
    if (filterConf && s.conferencia_nombre !== filterConf) return false;
    if (filterArea && s.area_tematica !== filterArea) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const estadoOptions = [
    { value: 'en_revision', label: 'En Revisión' },
    { value: 'aceptada', label: 'Aceptada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'aceptada_con_cambios', label: 'Cambios Req.' },
  ];

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filtered.length, page, totalPages]);

  const handleResubmit = async (ponenciaId) => {
    if (!resubmitFile) return;
    if (resubmitFile.type !== 'application/pdf') return;
    setResubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('archivo', resubmitFile);
      await conferencias.enviarCambios(ponenciaId, formData);
      setResubmitPonenciaId(null);
      setResubmitFile(null);
      addToast('Cambios enviados correctamente', 'success');
      emit('ponencia:actualizada');
      load();
    } catch (err) {
      addToast(err.message || 'Error al enviar cambios', 'error');
    } finally {
      setResubmitLoading(false);
    }
  };

  const handleFeedback = async (ponencia) => {
    setFeedbackPonencia(ponencia);
    setFeedbackLoading(true);
    setFeedbackData(null);
    try {
      const data = await reviews.verVeredicto(ponencia.id);
      setFeedbackData(data);
    } catch (err) {
      setFeedbackData({ error: err.message });
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', marginBottom: '6px' }}>
            Dashboard {'>'} Mis Ponencias
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E', margin: 0, lineHeight: 1.2 }}>
            Mis Ponencias
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            background: '#1A1A2E',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Nueva Participación
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            flex: 1,
            minWidth: '200px',
            maxWidth: '280px',
            background: '#FFFFFF',
            border: '1px solid #E5E8EB',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9CA3AF' }}>search</span>
          <input
            type="text"
            placeholder="Buscar ponencia..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: '#2C3E50',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <select
          value={filterEstado}
          onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            background: '#FFFFFF',
            border: '1px solid #E5E8EB',
            color: '#2C3E50',
            minWidth: '140px',
          }}
        >
          <option value="">Todos los estados</option>
          {estadoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filterConf}
          onChange={(e) => { setFilterConf(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            background: '#FFFFFF',
            border: '1px solid #E5E8EB',
            color: '#2C3E50',
            minWidth: '160px',
          }}
        >
          <option value="">Todas las conf.</option>
          {confOptions.map((c) => (
            <option key={c.slug || c.id} value={c.nombre}>{c.nombre}</option>
          ))}
        </select>

        <select
          value={filterArea}
          onChange={(e) => { setFilterArea(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            background: '#FFFFFF',
            border: '1px solid #E5E8EB',
            color: '#2C3E50',
            minWidth: '160px',
          }}
        >
          <option value="">Todas las áreas</option>
          {uniqueAreas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: '14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>sync</span>
          Cargando...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E8EB',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '12px', color: '#9CA3AF' }}>inbox</span>
          <p style={{ fontSize: '14px', color: '#5D6D7E', margin: '0 0 4px' }}>No se encontraron ponencias.</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Intenta ajustar los filtros o crea una nueva postulación.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paginated.map((sub) => {
              const key = normalizeStatus(sub.estado);
              const st = STATUS_MAP[key] || STATUS_MAP.enviado;
              return (
                <div
                  key={sub.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E8EB',
                    borderLeft: `3px solid ${st.border}`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {sub.area_tematica && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#F2F4F4',
                          color: '#5D6D7E',
                        }}
                      >
                        {sub.area_tematica}
                      </span>
                    )}
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF' }}>#{sub.id}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 10px',
                        borderRadius: '999px',
                        background: st.badge.bg,
                        color: st.badge.text,
                        border: `1px solid ${st.badge.text}22`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: st.badge.dot,
                        }}
                      />
                      {st.badge.label}
                    </span>
                    {sub.pago_confirmado === true && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 10px',
                          borderRadius: '999px',
                          background: '#E8F5E9',
                          color: '#1E8449',
                          border: '1px solid rgba(30,132,73,0.15)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                        Pagado
                      </span>
                    )}
                    {sub.pago_confirmado === false && sub.conferencia_es_de_pago && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 10px',
                          borderRadius: '999px',
                          background: '#FEF9E7',
                          color: '#9A6F00',
                          border: '1px solid rgba(212,172,13,0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>hourglass_empty</span>
                        Pago Pendiente
                      </span>
                    )}
                    {sub.conferencia_nombre && (
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF', marginLeft: 'auto' }}>
                        {sub.conferencia_nombre}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
                    {sub.titulo || 'Sin título'}
                  </h3>
                  <Stepper steps={st.steps} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {(key === 'aceptada' || key === 'rechazada' || key === 'aceptada_con_cambios' || key === 'cambios_enviados') && (
                      <button
                        onClick={() => handleFeedback(sub)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid #E5E8EB',
                          cursor: 'pointer',
                          background: '#FFFFFF',
                          color: '#2C3E50',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>rate_review</span>
                        Ver Feedback
                      </button>
                    )}
                    {key === 'aceptada_con_cambios' && (
                      <button
                        onClick={() => {
                          setResubmitPonenciaId(resubmitPonenciaId === sub.id ? null : sub.id);
                          setResubmitFile(null);
                        }}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: '#D4AC0D',
                          color: '#FFFFFF',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'text-bottom', marginRight: '4px' }}>refresh</span>
                        Reenviar Ponencia
                      </button>
                    )}
                    {key === 'aceptada' && (
                      <button
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: '#1E8449',
                          color: '#FFFFFF',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'text-bottom', marginRight: '4px' }}>download</span>
                        Descargar Certificado
                      </button>
                    )}
                  </div>
                  {resubmitPonenciaId === sub.id && (
                    <div style={{
                      marginTop: 4,
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: '#FEF9E7',
                      border: '1px solid rgba(212, 172, 13, 0.2)',
                    }}>
                      <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#9A6F00' }}>
                        Subí el archivo PDF corregido según las observaciones recibidas
                      </p>
                      <div
                        style={{
                          border: `2px dashed ${resubmitFile ? '#D4AC0D' : '#D4AC0D66'}`,
                          borderRadius: 10,
                          padding: '16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: resubmitFile ? '#FFF' : '#FFFBEB',
                          marginBottom: 10,
                        }}
                        onClick={() => document.getElementById(`resubmit-pdf-${sub.id}`).click()}
                      >
                        {resubmitFile ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#9A6F00' }}>picture_as_pdf</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A2E' }}>{resubmitFile.name}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#9A6F00', display: 'block', marginBottom: 4 }}>upload_file</span>
                            <span style={{ fontSize: '12px', color: '#5D6D7E' }}>Hacé clic para subir PDF corregido</span>
                          </div>
                        )}
                        <input
                          id={`resubmit-pdf-${sub.id}`}
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setResubmitFile(e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { setResubmitPonenciaId(null); setResubmitFile(null); }}
                          style={{
                            padding: '7px 16px',
                            borderRadius: 6,
                            border: '1px solid #E5E8EB',
                            background: '#FFF',
                            color: '#2C3E50',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleResubmit(sub.id)}
                          disabled={!resubmitFile || resubmitLoading}
                          style={{
                            padding: '7px 20px',
                            borderRadius: 6,
                            border: 'none',
                            background: (!resubmitFile || resubmitLoading) ? '#B8892E' : '#9A6F00',
                            color: '#FFF',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: (!resubmitFile || resubmitLoading) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            opacity: (!resubmitFile || resubmitLoading) ? 0.6 : 1,
                          }}
                        >
                          {resubmitLoading && (
                            <div style={{
                              width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                              borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                            }} />
                          )}
                          {resubmitLoading ? 'Enviando...' : 'Enviar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid #E5E8EB',
                  cursor: safePage <= 1 ? 'default' : 'pointer',
                  background: '#FFFFFF',
                  color: '#2C3E50',
                  opacity: safePage <= 1 ? 0.3 : 1,
                }}
              >
                ‹ Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: p === safePage ? 'none' : '1px solid #E5E8EB',
                    cursor: 'pointer',
                    background: p === safePage ? '#1A1A2E' : '#FFFFFF',
                    color: p === safePage ? '#FFFFFF' : '#2C3E50',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid #E5E8EB',
                  cursor: safePage >= totalPages ? 'default' : 'pointer',
                  background: '#FFFFFF',
                  color: '#2C3E50',
                  opacity: safePage >= totalPages ? 0.3 : 1,
                }}
              >
                Siguiente ›
              </button>
            </div>
          )}
        </>
      )}

      {showModal && <PostularModal isOpen={showModal} onClose={() => { setShowModal(false); load(); }} onSuccess={() => { setShowModal(false); load(); }} />}

      {feedbackPonencia && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeedbackPonencia(null); }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 500,
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              animation: 'feedbackFadeIn 0.2s ease-out',
              position: 'relative',
            }}
          >
            <style>{`
              @keyframes feedbackFadeIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
            `}</style>
            <button
              onClick={() => setFeedbackPonencia(null)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'transparent', border: 'none',
                cursor: 'pointer', color: '#9CA3AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 6,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#1A1A2E'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#FEF9E7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#9A6F00' }}>rate_review</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1A2E' }}>
                  Feedback - #{feedbackPonencia.id}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                  {feedbackPonencia.titulo || 'Sin título'}
                </p>
              </div>
            </div>

            {feedbackLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
                <div style={{
                  width: 20, height: 20, border: '2px solid #E5E8EB',
                  borderTopColor: '#D4AC0D', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ fontSize: '13px', color: '#5D6D7E' }}>Cargando feedback...</span>
              </div>
            ) : feedbackData ? (
              feedbackData.error ? (
                <div style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: 'rgba(192,57,43,0.06)',
                  border: '1px solid rgba(192,57,43,0.12)',
                }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#C0392B', fontWeight: 600 }}>
                    {feedbackData.error}
                  </p>
                </div>
              ) : feedbackData.veredicto_final ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: 10,
                    background: '#F5F7FA', border: '1px solid #E5E8EB',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#5D6D7E' }}>Veredicto final:</span>
                    <span style={{
                      fontSize: '12px', fontWeight: 700, padding: '2px 10px',
                      borderRadius: '999px',
                      background: feedbackData.veredicto_final.resultado === 'aceptado' ? '#E8F5E9'
                        : feedbackData.veredicto_final.resultado === 'rechazado' ? '#FDEDEC'
                        : feedbackData.veredicto_final.resultado === 'aceptado_con_cambios' ? '#FEF9E7'
                        : '#F2F4F4',
                      color: feedbackData.veredicto_final.resultado === 'aceptado' ? '#1E8449'
                        : feedbackData.veredicto_final.resultado === 'rechazado' ? '#C0392B'
                        : feedbackData.veredicto_final.resultado === 'aceptado_con_cambios' ? '#9A6F00'
                        : '#5D6D7E',
                    }}>
                      {feedbackData.veredicto_final.resultado === 'aceptado' ? 'Aceptada'
                        : feedbackData.veredicto_final.resultado === 'rechazado' ? 'Rechazada'
                        : feedbackData.veredicto_final.resultado === 'aceptado_con_cambios' ? 'Aceptada con Cambios'
                        : feedbackData.veredicto_final.resultado || 'N/A'}
                    </span>
                  </div>
                  {feedbackData.veredicto_final.resumen_para_autor && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 600, color: '#5D6D7E' }}>
                        Comentarios del revisor:
                      </p>
                      <div style={{
                        padding: '14px 16px', borderRadius: 10,
                        background: '#FAFAFA', border: '1px solid #E5E8EB',
                        fontSize: '13px', color: '#2C3E50', lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {feedbackData.veredicto_final.resumen_para_autor}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: 10,
                    background: '#FEF9E7', border: '1px solid #D4AC0D',
                    fontSize: '13px', color: '#9A6F00', fontWeight: 600,
                  }}>
                    {feedbackData.completadas} de {feedbackData.total_revisiones} revisión{feedbackData.total_revisiones !== 1 ? 'es' : ''} completada{feedbackData.total_revisiones !== 1 ? 's' : ''}
                  </div>
                  {feedbackData.revisiones_completadas?.map((rev, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', borderRadius: 10,
                      background: '#FAFAFA', border: '1px solid #E5E8EB',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#FEF9E7', fontSize: '11px', fontWeight: 700, color: '#9A6F00',
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>rate_review</span>
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A2E' }}>
                          Revisor {i + 1}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '1px 8px',
                          borderRadius: '999px',
                          background: rev.veredicto === 'aceptado' ? '#E8F5E9'
                            : rev.veredicto === 'rechazado' ? '#FDEDEC'
                            : rev.veredicto === 'aceptado_con_cambios' ? '#FEF9E7'
                            : '#F2F4F4',
                          color: rev.veredicto === 'aceptado' ? '#1E8449'
                            : rev.veredicto === 'rechazado' ? '#C0392B'
                            : rev.veredicto === 'aceptado_con_cambios' ? '#9A6F00'
                            : '#5D6D7E',
                        }}>
                          {rev.veredicto === 'aceptado' ? 'Aceptado'
                            : rev.veredicto === 'rechazado' ? 'Rechazado'
                            : rev.veredicto === 'aceptado_con_cambios' ? 'Aceptado con Cambios'
                            : rev.veredicto || 'Pendiente'}
                        </span>
                      </div>
                      {rev.comentario_autor && (
                        <p style={{ margin: 0, fontSize: '13px', color: '#2C3E50', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {rev.comentario_autor}
                        </p>
                      )}
                    </div>
                  ))}
                  {feedbackData.completadas < feedbackData.total_revisiones && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: '#F5F7FA', fontSize: '12px', color: '#5D6D7E', textAlign: 'center',
                    }}>
                      Esperando que los demás revisores completen su evaluación...
                    </div>
                  )}
                </div>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default MisPonencias;
