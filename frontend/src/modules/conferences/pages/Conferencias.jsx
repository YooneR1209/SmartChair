import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { conferencias } from '../../../shared/services/api';
import CreateConferenceModal from '../components/CreateConferenceModal';
import { useToast } from '../../../shared/components/ToastContext';
import { emit, on } from '../../../shared/services/events';

function Conferencias() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editConference, setEditConference] = useState(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState(null);
  const profileRaw = localStorage.getItem('profile');
  const profile = profileRaw ? JSON.parse(profileRaw) : null;
  const userRole = (localStorage.getItem('selectedRole') || profile?.rol || '').toUpperCase();

  const isOrganizer = userRole === 'ORGANIZADOR' || userRole === 'ADMINISTRADOR';
  const isAdmin = userRole === 'ADMINISTRADOR';

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

  const handleClone = async (slug) => {
    try {
      await conferencias.clonar(slug);
      await fetchList();
      addToast('Conferencia clonada correctamente', 'success');
      emit('conferencia:actualizada');
    } catch (err) { addToast(err.message || 'Error al clonar', 'error'); }
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
      abierta: { bg: '#E8F5E9', color: '#1E8449', label: 'Abierta' },
      activa: { bg: '#E8F5E9', color: '#1E8449', label: 'Activa' },
      cerrada: { bg: '#FDEDEC', color: '#C0392B', label: 'Cerrada' },
      borrador: { bg: '#F0F0F0', color: '#5D6D7E', label: 'Borrador' },
      en_revision: { bg: '#FEF9E7', color: '#9A6F00', label: 'En Revisión' },
      archivada: { bg: '#E8E8E8', color: '#4A4A4A', label: 'Archivada' },
    };
    return map[estado] || { bg: '#F0F0F0', color: '#5D6D7E', label: estado };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', marginBottom: '6px' }}>
            Dashboard &gt; Conferencias
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Conferencias</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>
            {list.length} conferencia{list.length !== 1 ? 's' : ''} disponible{list.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isOrganizer && (
          <button onClick={() => { setEditConference(null); setShowCreateModal(true); }} style={{
            padding: '10px 20px', background: '#1A1A2E', color: '#fff',
            border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
          }}>
            + Nueva Conferencia
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: '14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>sync</span>
          Cargando...
        </div>
      ) : list.length === 0 ? (
        <div style={{ padding: '64px 48px', textAlign: 'center', background: '#fff', border: '1px solid #E5E8EB', borderRadius: '12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#D0D0D0', display: 'block', marginBottom: '12px' }}>groups</span>
          <p style={{ color: '#5D6D7E', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>No hay conferencias disponibles</p>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
            Ejecuta <code style={{ background: '#F2F4F4', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>python manage.py seed_conferences</code> para crear datos de prueba.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {list.map((conf) => {
            const st = getEstadoStyle(conf.estado);
            const esPaga = conf.es_de_pago || conf.monto_inscripcion;
            return (
              <div key={conf.id || conf.slug} style={{
                background: '#fff', border: '1px solid #E5E8EB', borderRadius: '12px',
                padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#1A1A2E' }}>
                      {conf.nombre}
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
                      {conf.lugar || 'Institución no especificada'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                    {esPaga && (
                      <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: '#FEF9E7', color: '#D4AC0D' }}>
                        ${conf.monto_inscripcion}
                      </span>
                    )}
                  </div>
                </div>

                {conf.descripcion && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#5D6D7E', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {conf.descripcion}
                  </p>
                )}

                {conf.areas_tematicas && conf.areas_tematicas.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {conf.areas_tematicas.slice(0, 3).map((area) => (
                      <span key={area} style={{ fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: '#F2F4F4', color: '#5D6D7E' }}>
                        {area}
                      </span>
                    ))}
                    {conf.areas_tematicas.length > 3 && (
                      <span style={{ fontSize: '9px', fontWeight: 600, color: '#9CA3AF' }}>+{conf.areas_tematicas.length - 3}</span>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#9CA3AF' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>calendar_month</span>
                  {formatDate(conf.fecha_inicio)} — {formatDate(conf.fecha_fin)}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #F2F4F4' }}>
                  <button onClick={() => navigate(`/conferencias/${conf.slug}`)}
                    style={{ padding: '6px 14px', background: '#1A1A2E', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Ver Detalle
                  </button>
                  {(conf.estado === 'abierta' || conf.estado === 'activa') && (
                    <button onClick={() => navigate(`/conferencias/${conf.slug}`)}
                      style={{ padding: '6px 14px', background: '#9A6F00', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Participar
                    </button>
                  )}
                  {isOrganizer && (
                    <>
                      <button onClick={() => { setEditConference(conf); setShowCreateModal(true); }}
                        style={{ padding: '6px 14px', background: '#F5F7FA', color: '#2C3E50', border: '1px solid #E8EAED', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => handleClone(conf.slug)}
                        style={{ padding: '6px 14px', background: '#F5F7FA', color: '#2C3E50', border: '1px solid #E8EAED', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        Clonar
                      </button>
                      <button onClick={() => setConfirmDeleteSlug(conf.slug)}
                        style={{ padding: '6px 14px', background: '#FDEDEC', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateConferenceModal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setEditConference(null); }}
          conference={editConference}
          onSaved={handleSaved}
        />
      )}

      {confirmDeleteSlug && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }} onClick={() => setConfirmDeleteSlug(null)}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#1A1A2E' }}>¿Eliminar conferencia?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#5D6D7E', lineHeight: 1.5 }}>
              Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta conferencia?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteSlug(null)}
                style={{ padding: '8px 16px', border: '1px solid #E5E8EB', borderRadius: '8px', background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDeleteSlug)}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#C0392B', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
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
