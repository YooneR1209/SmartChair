import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { conferencias, payments } from '../../../shared/services/api';
import AssignReviewersModal from '../../../shared/components/AssignReviewersModal';
import { useToast } from '../../../shared/components/ToastContext';
import { emit } from '../../../shared/services/events';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripeKeyValid = STRIPE_KEY && STRIPE_KEY !== 'pk_test_placeholder' && STRIPE_KEY.startsWith('pk_');
const stripePromise = stripeKeyValid ? loadStripe(STRIPE_KEY) : null;

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

function DetalleConferencia() {
  const { addToast } = useToast();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [conf, setConf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inscrito, setInscrito] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPonencia, setSelectedPonencia] = useState(null);
  const [ponencias, setPonencias] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const profileRaw = localStorage.getItem('profile');
  const profile = profileRaw ? JSON.parse(profileRaw) : null;
  const userRole = (localStorage.getItem('selectedRole') || profile?.rol || '').toUpperCase();
  const isOrganizer = userRole === 'ORGANIZADOR' || userRole === 'ADMINISTRADOR';

  const [showRegModal, setShowRegModal] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);

  const handleInscribir = async () => {
    setRegistrando(true);
    setRegError('');
    try {
      const res = await conferencias.inscribir(slug, { rol: 'asistente' });
      if (res.requires_payment && res.client_secret) {
        setPendingPayment({ clientSecret: res.client_secret, monto: res.monto, pagoId: res.pago_id });
      } else {
        setRegSuccess(true);
        setInscrito(true);
        addToast(res.detail || 'Inscripción exitosa', 'success');
        emit('inscripcion:realizada');
        setTimeout(() => { setShowRegModal(false); setRegSuccess(false); }, 1500);
      }
    } catch (err) {
      const msg = err.message || 'Error al inscribirse';
      if (msg.toLowerCase().includes('ya estás inscrito')) {
        setInscrito(true);
        addToast('Ya estás inscrito en esta conferencia', 'info');
        setShowRegModal(false);
        return;
      }
      setRegError(msg);
    } finally {
      setRegistrando(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await conferencias.detalle(slug);
        setConf(data);
        try {
          const [parts] = await Promise.all([
            conferencias.listarParticipantes(slug),
          ]);
          const partList = Array.isArray(parts) ? parts : [];
          if (profile && partList.some(p => p.usuario_email === profile.email)) {
            setInscrito(true);
          }
          if (isOrganizer) setParticipantes(partList);
        } catch { /* ignore */ }
        if (isOrganizer) {
          try {
            const pons = await conferencias.listarPonencias(slug);
            setPonencias(Array.isArray(pons) ? pons : []);
          } catch { setPonencias([]); }
        }
      } catch { setConf(null); }
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      addToast('Ingresa un correo electrónico', 'warning');
      return;
    }
    try {
      await conferencias.invitarRevisor(slug, inviteEmail);
      addToast('Invitación enviada correctamente.', 'success');
      setInviteEmail('');
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
    }
  };

  const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: 40, height: 40, border: '3px solid ' + C.border, borderTopColor: C.goldLight, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: C.textSecondary, fontSize: '14px', margin: 0 }}>Cargando conferencia...</p>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  if (!conf) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: C.red }}>error_outline</span>
      <p style={{ color: C.red, fontSize: '16px', fontWeight: 600 }}>Conferencia no encontrada.</p>
    </div>
  );

  const activa = conf.estado === 'abierta' || conf.estado === 'activa';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ margin: '0 0 6px', color: C.textSecondary, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => navigate('/conferencias')}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Volver a Conferencias
        </p>
        <h1 style={{ margin: '8px 0 0', fontSize: '1.85rem', fontWeight: 800, color: C.dark }}>
          {conf.nombre}
        </h1>
      </div>

      <div className="detalle-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: C.gold }}>info</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.dark }}>Información General</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.textMuted }}>business</span>
              <strong style={{ color: C.textSecondary, minWidth: '90px' }}>Institución:</strong>
              <span style={{ color: C.dark }}>{conf.institucion || '—'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.textMuted }}>
                {activa ? 'check_circle' : 'cancel'}
              </span>
              <strong style={{ color: C.textSecondary, minWidth: '90px' }}>Estado:</strong>
              <span style={{
                padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                background: activa ? 'rgba(30,132,73,0.12)' : 'rgba(192,57,43,0.1)',
                color: activa ? C.green : C.red,
              }}>
                {activa ? 'Abierta' : 'Cerrada'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.textMuted }}>calendar_today</span>
              <strong style={{ color: C.textSecondary, minWidth: '90px' }}>Inicio:</strong>
              <span style={{ color: C.dark }}>{formatDate(conf.fecha_inicio)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.textMuted }}>calendar_month</span>
              <strong style={{ color: C.textSecondary, minWidth: '90px' }}>Fin:</strong>
              <span style={{ color: C.dark }}>{formatDate(conf.fecha_fin)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.textMuted }}>payments</span>
              <strong style={{ color: C.textSecondary, minWidth: '90px' }}>Tipo:</strong>
              <span style={{
                padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                background: conf.es_de_pago ? 'rgba(30,132,73,0.12)' : 'rgba(26,26,46,0.08)',
                color: conf.es_de_pago ? C.green : C.dark,
              }}>
                {conf.es_de_pago ? `Pago ($${Number(conf.monto_inscripcion).toLocaleString(undefined, { minimumFractionDigits: 2 })})` : 'Gratis'}
              </span>
            </div>
            {conf.descripcion && (
              <div style={{ borderTop: '1px solid ' + C.bg, paddingTop: '14px' }}>
                <strong style={{ color: C.textSecondary, display: 'block', marginBottom: '6px' }}>Descripción:</strong>
                <p style={{ margin: 0, lineHeight: 1.6, color: C.dark, fontSize: '0.85rem' }}>{conf.descripcion}</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isOrganizer && (
            <>
            <div style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.gold }}>mail</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: C.dark }}>Invitar Revisor</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="correo@universidad.edu"
                  style={{ flex: 1, height: '44px', border: '1.5px solid ' + C.border, borderRadius: '10px', padding: '0 14px', fontSize: '0.88rem', outline: 'none', background: C.bg, color: C.dark }}
                />
                <button onClick={handleInvite} style={{
                  height: '44px', padding: '0 22px', background: C.dark, color: '#fff',
                  border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2C3E50'}
                  onMouseLeave={(e) => e.currentTarget.style.background = C.dark}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
                  Invitar
                </button>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(30,132,73,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.green }}>group</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: C.dark }}>Participantes ({participantes.length})</h3>
              </div>
              {participantes.length === 0 ? (
                <p style={{ fontSize: '13px', color: C.textMuted, margin: 0, textAlign: 'center', padding: '12px' }}>No hay participantes inscritos.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {participantes.map((p) => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                      background: C.bg, borderRadius: '8px', fontSize: '13px', transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#EEF0F2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = C.bg}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: C.goldLight,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                        fontSize: '12px', color: '#fff', flexShrink: 0,
                      }}>
                        {(p.usuario_nombre || p.usuario?.nombre || '?')[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: C.dark }}>{p.usuario_nombre || p.usuario?.nombre || '—'}</div>
                        <div style={{ fontSize: '11px', color: C.textMuted }}>{p.usuario_email || p.usuario?.email || ''} · {p.rol || 'asistente'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(21,101,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.blue }}>description</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: C.dark }}>Postulaciones ({ponencias.length})</h3>
              </div>
              {ponencias.length === 0 ? (
                <p style={{ fontSize: '13px', color: C.textMuted, margin: 0, textAlign: 'center', padding: '12px' }}>No hay postulaciones aún.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {ponencias.map((p) => {
                    const est = p.estado || 'postulada';
                    const estColor = est === 'aceptada' || est === 'completada' ? C.green : est === 'rechazada' ? C.red : est === 'aceptada_con_cambios' ? C.gold : C.blue;
                    const estBg = est === 'aceptada' || est === 'completada' ? 'rgba(30,132,73,0.1)' : est === 'rechazada' ? 'rgba(192,57,43,0.08)' : est === 'aceptada_con_cambios' ? C.goldBg : '#E3F2FD';
                    return (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: C.bg, borderRadius: '10px', gap: '10px',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#EEF0F2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = C.bg}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.titulo}</div>
                          <div style={{ fontSize: '11px', color: C.textMuted }}>{p.area_tematica}</div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: estBg, color: estColor, whiteSpace: 'nowrap' }}>
                          {est.replace(/_/g, ' ')}
                        </span>
                        <button onClick={() => { setSelectedPonencia(p); setShowAssignModal(true); }}
                          style={{
                            padding: '6px 12px', background: C.dark, color: '#fff', border: 'none',
                            borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#2C3E50'}
                          onMouseLeave={(e) => e.currentTarget.style.background = C.dark}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>manage_accounts</span>
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

          <div style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(212,172,13,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.goldLight }}>bolt</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: C.dark }}>Acciones</h3>
            </div>
            {inscrito ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(30,132,73,0.08)', borderRadius: '10px', border: '1px solid rgba(30,132,73,0.15)' }}>
                <span className="material-symbols-outlined" style={{ color: C.green, fontSize: '20px' }}>check_circle</span>
                <span style={{ color: C.green, fontSize: '14px', fontWeight: 600 }}>Estás inscrito en esta conferencia</span>
              </div>
            ) : (
              <button onClick={() => { setRegError(''); setRegSuccess(false); setPendingPayment(null); setShowRegModal(true); }} style={{
                padding: '12px 24px', background: C.goldLight, color: '#fff',
                border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                cursor: 'pointer', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#B8892E'}
                onMouseLeave={(e) => e.currentTarget.style.background = C.goldLight}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>how_to_reg</span>
                {conf.es_de_pago ? `Inscribirse ($${Number(conf.monto_inscripcion).toLocaleString(undefined, { minimumFractionDigits: 2 })})` : 'Inscribirse Gratis'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && selectedPonencia && (
        <AssignReviewersModal
          isOpen={showAssignModal}
          onClose={() => { setShowAssignModal(false); setSelectedPonencia(null); }}
          ponencia={selectedPonencia}
          conferenceSlug={slug}
          onAssigned={() => {
            setShowAssignModal(false);
            setSelectedPonencia(null);
            conferencias.listarPonencias(slug).then(d => setPonencias(Array.isArray(d) ? d : [])).catch(() => {});
          }}
        />
      )}

      {showRegModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          background: 'rgba(0,0,0,0.35)',
        }}
          onClick={(e) => { if (e.target === e.currentTarget && !registrando) setShowRegModal(false); }}
        >
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '32px', width: '100%',
            maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
          }}>
            {pendingPayment ? (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  clientSecret={pendingPayment.clientSecret}
                  monto={pendingPayment.monto}
                  onSuccess={() => {
                    setRegSuccess(true);
                    setInscrito(true);
                    addToast('Inscripción y pago exitosos', 'success');
                    emit('inscripcion:realizada');
                    setTimeout(() => { setShowRegModal(false); setRegSuccess(false); setPendingPayment(null); }, 1500);
                  }}
                  onError={(msg) => setRegError(msg)}
                />
              </Elements>
            ) : regSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '56px', color: C.green }}>check_circle</span>
                <h2 style={{ margin: '16px 0 0', fontSize: '1.3rem', fontWeight: 700, color: C.dark }}>¡Inscripción Exitosa!</h2>
                <p style={{ color: C.textSecondary, fontSize: '0.9rem' }}>Ya estás registrado en esta conferencia.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: C.gold }}>how_to_reg</span>
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: C.dark }}>Registro en Conferencia</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: C.textMuted }}>{conf.nombre}</p>
                  </div>
                </div>

                <div style={{ padding: '14px 18px', borderRadius: '12px', background: C.bg, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: C.textSecondary }}>person</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rol de participación</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: C.dark }}>Asistente</div>
                  </div>
                </div>

                {conf.es_de_pago && conf.monto_inscripcion && (
                  <div style={{
                    padding: '14px 18px', borderRadius: '12px',
                    background: 'rgba(212,172,13,0.08)', border: '1px solid rgba(212,172,13,0.15)',
                    marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: C.gold }}>payments</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Costo de inscripción</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: C.gold }}>
                        ${Number(conf.monto_inscripcion).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </div>
                    </div>
                  </div>
                )}

                {regError && (
                  <div style={{
                    padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                    marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.15)', color: C.red,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                    {regError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowRegModal(false)} disabled={registrando}
                    style={{
                      padding: '11px 24px', background: '#fff', color: C.dark,
                      border: '1px solid ' + C.border, borderRadius: '10px', fontWeight: 600,
                      cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = C.textMuted}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
                  >
                    Cancelar
                  </button>
                  <button onClick={handleInscribir} disabled={registrando}
                    style={{
                      padding: '11px 24px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700,
                      border: 'none',
                      background: registrando ? '#B8892E' : C.goldLight,
                      color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px',
                      cursor: registrando ? 'not-allowed' : 'pointer',
                      opacity: registrando ? 0.6 : 1, transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!registrando) e.currentTarget.style.background = '#B8892E'; }}
                    onMouseLeave={(e) => { if (!registrando) e.currentTarget.style.background = C.goldLight; }}
                  >
                    {registrando ? (
                      <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Registrando...</>
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>how_to_reg</span> Confirmar Registro</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentForm({ clientSecret, monto, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!stripe || !elements) { setError('Stripe no está listo.'); return; }
    setLoading(true);
    try {
      const cardElement = elements.getElement(CardNumberElement);
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
      if (confirmError) {
        setError(confirmError.message);
        if (onError) onError(confirmError.message);
      } else if (paymentIntent.status === 'succeeded') {
        try {
          await payments.confirmar({
            payment_intent_id: paymentIntent.id,
            charge_id: paymentIntent.latest_charge || '',
          });
        } catch { /* webhook fallback */ }
        if (onSuccess) onSuccess();
      } else {
        setError('Estado del pago: ' + paymentIntent.status);
      }
    } catch (err) {
      setError(err.message);
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const CARD_STYLE = {
    style: {
      base: { fontSize: '16px', color: '#2C3E50', fontFamily: 'Inter, sans-serif', '::placeholder': { color: '#9CA3AF' } },
      invalid: { color: '#C0392B' },
    },
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(30,132,73,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: C.green }}>credit_card</span>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: C.dark }}>Pago de Inscripción</h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: C.textMuted }}>Completa el pago para finalizar tu registro</p>
        </div>
      </div>

      <div style={{ padding: '16px', borderRadius: '12px', background: C.goldBg, border: '1px solid rgba(212,172,13,0.15)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: C.gold }}>payments</span>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total a pagar</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: C.gold }}>
            ${Number(monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>Número de Tarjeta</label>
        <div style={{ padding: '12px 14px', border: '1.5px solid ' + C.border, borderRadius: '10px', background: '#fff' }}>
          <CardNumberElement options={CARD_STYLE} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>Fecha de Exp.</label>
          <div style={{ padding: '12px 14px', border: '1.5px solid ' + C.border, borderRadius: '10px', background: '#fff' }}>
            <CardExpiryElement options={CARD_STYLE} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: C.dark, marginBottom: '6px' }}>CVC</label>
          <div style={{ padding: '12px 14px', border: '1.5px solid ' + C.border, borderRadius: '10px', background: '#fff' }}>
            <CardCvcElement options={CARD_STYLE} />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.15)', color: C.red }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          {error}
        </div>
      )}

      <button type="submit" disabled={!stripe || loading} style={{
        width: '100%', height: '50px', border: 'none', borderRadius: '10px',
        background: loading ? C.textSecondary : C.dark, color: '#fff',
        fontSize: '1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'background 0.15s',
      }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#2C3E50'; }}
        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = C.dark; }}
      >
        {loading ? (
          <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Procesando pago...</>
        ) : (
          <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span> Pagar ${Number(monto).toLocaleString(undefined, { minimumFractionDigits: 2 })}</>
        )}
      </button>
    </form>
  );
}

export default DetalleConferencia;
