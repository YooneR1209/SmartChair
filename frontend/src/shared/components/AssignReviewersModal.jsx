import { useState, useEffect } from 'react';
import { reviews, conferencias } from '../services/api';

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

function AssignReviewersModal({ isOpen, onClose, ponencia, conferenceSlug, onAssigned }) {
  const [activeTab, setActiveTab] = useState('asignar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [revisores, setRevisores] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [revisiones, setRevisiones] = useState([]);
  const [veredicto, setVeredicto] = useState(null);
  const [nuevoResultado, setNuevoResultado] = useState('');
  const [resumenAutor, setResumenAutor] = useState('');
  const [plazoCambios, setPlazoCambios] = useState('');

  useEffect(() => {
    if (!isOpen || activeTab !== 'asignar') return;
    cargarRevisores();
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'gestionar' || !ponencia) return;
    let active = true;
    const load = async () => {
      try {
        const data = await reviews.revisionesPorPonencia(ponencia.id);
        if (!active) return;
        setRevisiones(Array.isArray(data) ? data : data.results || []);
        try {
          const v = await reviews.verVeredicto(ponencia.id);
          if (active) setVeredicto(v);
        } catch {
          if (active) setVeredicto(null);
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [isOpen, activeTab, ponencia]);

  const cargarRevisores = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await conferencias.listarRevisores(conferenceSlug);
      setRevisores(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarRevisiones = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reviews.revisionesPorPonencia(ponencia.id);
      setRevisiones(Array.isArray(data) ? data : data.results || []);
      try {
        const v = await reviews.verVeredicto(ponencia.id);
        setVeredicto(v);
      } catch {
        setVeredicto(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRevisor = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const asignarSeleccionados = async () => {
    if (selectedIds.length === 0) {
      setError('Selecciona al menos un revisor.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      for (const id of selectedIds) {
        await reviews.asignarRevisor({ ponencia_id: ponencia.id, revisor_id: id });
      }
      setSuccess(`${selectedIds.length} revisor(es) asignado(s) correctamente.`);
      setSelectedIds([]);
      if (onAssigned) onAssigned();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const asignarAutomatico = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await reviews.asignarAutomatico(ponencia.id);
      setSuccess('Revisores asignados automáticamente.');
      if (onAssigned) onAssigned();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const emitirVeredicto = async () => {
    if (!nuevoResultado) {
      setError('Selecciona un resultado para el veredicto.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = { resultado: nuevoResultado };
      if (resumenAutor.trim()) payload.resumen_para_autor = resumenAutor.trim();
      if (nuevoResultado === 'aceptado_con_cambios' && plazoCambios) payload.plazo_cambios = plazoCambios;
      await reviews.emitirVeredicto(ponencia.id, payload);
      setSuccess('Veredicto emitido correctamente.');
      setNuevoResultado('');
      setResumenAutor('');
      setPlazoCambios('');
      await cargarRevisiones();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    border: 'none',
    borderBottom: isActive ? '3px solid ' + C.goldLight : '3px solid transparent',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: isActive ? 700 : 600,
    color: isActive ? C.gold : C.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        style={{
          background: '#fff', width: '100%', maxWidth: '800px',
          borderRadius: '20px', padding: '32px', position: 'relative',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
        }}
      >
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '36px', height: '36px', borderRadius: '50%',
            border: 'none', background: C.bg, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.textSecondary, transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.border; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.bg; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
        </button>

        {ponencia && (
          <div style={{ marginBottom: '24px', paddingRight: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.gold }}>description</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark }}>{ponencia.titulo}</h2>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginLeft: '52px', fontSize: '13px', color: C.textSecondary }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: C.textMuted }}>category</span>
                {ponencia.area_tematica}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: C.textMuted }}>person</span>
                {ponencia.autor_nombre || ponencia.autor || '—'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: C.textMuted }}>flag</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                  background: ponencia.estado === 'en_revision' ? '#FFF3E0' : ponencia.estado === 'aceptada' ? 'rgba(30,132,73,0.1)' : '#E3F2FD',
                  color: ponencia.estado === 'en_revision' ? C.orange : ponencia.estado === 'aceptada' ? C.green : C.blue,
                }}>
                  {ponencia.estado?.replace(/_/g, ' ') || 'postulada'}
                </span>
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid ' + C.border, marginBottom: '24px' }}>
          <button style={tabStyle(activeTab === 'asignar')} onClick={() => setActiveTab('asignar')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Asignar Revisor
          </button>
          <button style={tabStyle(activeTab === 'gestionar')} onClick={() => setActiveTab('gestionar')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rate_review</span>
            Gestionar Revisiones
          </button>
        </div>

        {error && (
          <div style={{
            padding: '14px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.15)', color: C.red,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: '14px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(30,132,73,0.08)', border: '1px solid rgba(30,132,73,0.15)', color: C.green,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
            {success}
          </div>
        )}

        {activeTab === 'asignar' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.dark }}>Revisores Disponibles</h3>
              {revisores.length > 0 && (
                <span style={{ fontSize: '12px', color: C.textMuted }}>({revisores.length} encontrados)</span>
              )}
            </div>
            {loading && revisores.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid ' + C.border, borderTopColor: C.goldLight, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: '13px', color: C.textMuted, margin: 0 }}>Cargando revisores...</p>
                <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
              </div>
            ) : revisores.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: C.textMuted }}>person_off</span>
                <p style={{ fontSize: '13px', color: C.textMuted, margin: '12px 0 0' }}>No hay revisores disponibles.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {revisores.map(r => {
                  const selected = selectedIds.includes(r.id);
                  const name = r.nombre_completo || (r.nombres + ' ' + (r.apellidos || '')).trim();
                  const initials = getInitials(name);
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleRevisor(r.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 16px', borderRadius: '12px',
                        background: selected ? C.goldBg : C.bg,
                        border: selected ? '1.5px solid ' + C.goldLight : '1.5px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRevisor(r.id)}
                        style={{ width: '18px', height: '18px', accentColor: C.goldLight, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: selected ? C.goldLight : C.dark,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '13px', color: '#fff', flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {name}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.email}
                        </p>
                      </div>
                      {selected && (
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: C.goldLight }}>check_circle</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={asignarAutomatico}
                disabled={loading}
                style={{
                  padding: '11px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                  border: '1px solid ' + C.border, background: '#FFF', color: C.dark,
                  cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.borderColor = C.goldLight; e.currentTarget.style.color = C.gold; } }}
                onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dark; } }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_awesome</span>
                Asignar Automáticamente
              </button>
              <button
                onClick={asignarSeleccionados}
                disabled={loading || selectedIds.length === 0}
                style={{
                  padding: '11px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                  border: 'none', background: loading || selectedIds.length === 0 ? '#B8892E' : C.goldLight,
                  color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: loading || selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: loading || selectedIds.length === 0 ? 0.6 : 1, transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!loading && selectedIds.length > 0) e.currentTarget.style.background = '#B8892E'; }}
                onMouseLeave={(e) => { if (!loading && selectedIds.length > 0) e.currentTarget.style.background = C.goldLight; }}
              >
                {loading ? (
                  <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Asignando...</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>how_to_reg</span> Asignar Seleccionados</>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'gestionar' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.dark }}>Revisiones Recibidas</h3>
              {revisiones.length > 0 && (
                <span style={{ fontSize: '12px', color: C.textMuted }}>({revisiones.length} revisión(es))</span>
              )}
            </div>
            {loading && revisiones.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid ' + C.border, borderTopColor: C.goldLight, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: '13px', color: C.textMuted, margin: 0 }}>Cargando revisiones...</p>
              </div>
            ) : revisiones.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: C.textMuted }}>rate_review</span>
                <p style={{ fontSize: '13px', color: C.textMuted, margin: '12px 0 0' }}>No hay revisiones todavía.</p>
              </div>
            ) : (
              revisiones.map(rev => (
                <div
                  key={rev.id}
                  style={{
                    padding: '16px 18px', borderRadius: '12px', margin: '8px 0',
                    background: C.bg, border: '1px solid ' + C.border,
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: rev.estado === 'completada' ? C.green : C.orange,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fff' }}>
                          {rev.estado === 'completada' ? 'check' : 'hourglass_empty'}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: C.dark }}>
                        {rev.revisor_nombre || rev.revisor?.nombre || 'Revisor #' + rev.revisor}
                      </span>
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                      background: rev.estado === 'completada' ? 'rgba(30,132,73,0.12)' : 'rgba(230,126,34,0.12)',
                      color: rev.estado === 'completada' ? C.green : C.orange,
                    }}>
                      {rev.estado === 'completada' ? 'Completada' : 'Pendiente'}
                    </span>
                  </div>
                  {rev.veredicto && (
                    <p style={{ margin: '6px 0', fontSize: '13px', color: C.dark, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: C.textSecondary }}>Veredicto:</strong>
                      <span style={{
                        padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        background: rev.veredicto === 'aceptado' ? 'rgba(30,132,73,0.1)' : rev.veredicto === 'rechazado' ? 'rgba(192,57,43,0.08)' : C.goldBg,
                        color: rev.veredicto === 'aceptado' ? C.green : rev.veredicto === 'rechazado' ? C.red : C.gold,
                      }}>
                        {rev.veredicto.replace(/_/g, ' ')}
                      </span>
                    </p>
                  )}
                  {rev.comentario_privado && (
                    <div style={{ margin: '6px 0 0', padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid ' + C.border }}>
                      <p style={{ margin: 0, fontSize: '12px', color: C.textSecondary, fontStyle: 'italic', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, fontStyle: 'normal' }}>Nota privada: </span>
                        {rev.comentario_privado}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}

            <div style={{
              marginTop: '24px', padding: '24px', borderRadius: '14px',
              background: '#FAFAFA', border: '1px solid ' + C.border,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(212,172,13,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.goldLight }}>gavel</span>
                </div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.dark }}>
                  {veredicto ? 'Veredicto Actual' : 'Emitir Veredicto Final'}
                </h4>
              </div>

              {veredicto ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{
                      padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                      background: veredicto.resultado === 'aceptado' ? 'rgba(30,132,73,0.12)' :
                        veredicto.resultado === 'rechazado' ? 'rgba(192,57,43,0.12)' : C.goldBg,
                      color: veredicto.resultado === 'aceptado' ? C.green :
                        veredicto.resultado === 'rechazado' ? C.red : C.gold,
                    }}>
                      {veredicto.resultado === 'aceptado' ? '✓ Aceptado' :
                        veredicto.resultado === 'rechazado' ? '✕ Rechazado' : '↻ Aceptado con cambios'}
                    </span>
                    {veredicto.fecha && (
                      <span style={{ fontSize: '12px', color: C.textMuted }}>
                        {new Date(veredicto.fecha).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {veredicto.resumen_para_autor && (
                    <div style={{ padding: '12px 16px', background: '#fff', borderRadius: '10px', border: '1px solid ' + C.border, marginBottom: '12px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resumen para el autor</p>
                      <p style={{ margin: 0, fontSize: '13px', color: C.textSecondary }}>{veredicto.resumen_para_autor}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setVeredicto(null)}
                    style={{
                      padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                      border: '1px solid ' + C.border, background: '#FFF', color: C.dark, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.color = C.orange; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dark; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    Re-emitir Veredicto
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>
                      Resultado <span style={{ color: C.red }}>*</span>
                    </label>
                    <select
                      value={nuevoResultado}
                      onChange={(e) => setNuevoResultado(e.target.value)}
                      style={{
                        width: '100%', height: '46px', borderRadius: '10px', padding: '0 14px',
                        fontSize: '13px', border: '1.5px solid ' + C.border, outline: 'none',
                        background: '#FFF', color: C.dark, cursor: 'pointer',
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="aceptado">✓ Aceptado</option>
                      <option value="rechazado">✕ Rechazado</option>
                      <option value="aceptado_con_cambios">↻ Aceptado con cambios</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>
                      Resumen para el autor <span style={{ fontWeight: 400, color: C.textMuted }}>(opcional)</span>
                    </label>
                    <textarea
                      value={resumenAutor}
                      onChange={(e) => setResumenAutor(e.target.value)}
                      placeholder="Resumen o comentarios para el autor..."
                      rows={3}
                      style={{
                        width: '100%', borderRadius: '10px', padding: '12px 14px',
                        fontSize: '13px', border: '1.5px solid ' + C.border, outline: 'none',
                        resize: 'vertical', fontFamily: 'inherit', color: C.dark,
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = C.goldLight}
                      onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                    />
                  </div>

                  {nuevoResultado === 'aceptado_con_cambios' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>
                        Plazo para cambios
                      </label>
                      <input
                        type="date"
                        value={plazoCambios}
                        onChange={(e) => setPlazoCambios(e.target.value)}
                        style={{
                          width: '100%', height: '46px', borderRadius: '10px', padding: '0 14px',
                          fontSize: '13px', border: '1.5px solid ' + C.border, outline: 'none',
                          color: C.dark, cursor: 'pointer',
                        }}
                      />
                    </div>
                  )}

                  <button
                    onClick={emitirVeredicto}
                    disabled={loading || !nuevoResultado}
                    style={{
                      padding: '12px 28px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                      border: 'none', background: loading || !nuevoResultado ? '#B8892E' : C.goldLight,
                      color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px',
                      cursor: loading || !nuevoResultado ? 'not-allowed' : 'pointer',
                      opacity: loading || !nuevoResultado ? 0.6 : 1, transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!loading && nuevoResultado) e.currentTarget.style.background = '#B8892E'; }}
                    onMouseLeave={(e) => { if (!loading && nuevoResultado) e.currentTarget.style.background = C.goldLight; }}
                  >
                    {loading ? (
                      <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Emitiendo...</>
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>gavel</span> Emitir Veredicto Final</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssignReviewersModal;
