import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { conferencias, auth } from '../../../shared/services/api';
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
  const [inviteLoading, setInviteLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserResults, setShowUserResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
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
      } catch { setConf(null); }
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleInvite = async () => {
    const target = selectedUser || userSearch.trim();
    if (!target) {
      addToast('Busca un usuario o escribe un correo', 'warning');
      return;
    }
    const email = typeof target === 'object' ? target.email : target;
    if (!email || !email.includes('@')) {
      addToast('Ingresa un correo válido', 'warning');
      return;
    }
    setInviteLoading(true);
    try {
      await conferencias.invitarRevisor(slug, email);
      addToast('Invitación enviada correctamente.', 'success');
      setSelectedUser(null);
      setUserSearch('');
      setUserResults([]);
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUserSearch = (value) => {
    setUserSearch(value);
    setActiveIndex(-1);
    if (selectedUser) setSelectedUser(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setUserResults([]);
      setShowUserResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await auth.buscarUsuarios(value.trim());
        const filtered = data.filter(u => u.is_active !== false && u.rol !== 'administrador');
        setUserResults(filtered);
        setShowUserResults(filtered.length > 0);
      } catch {
        setUserResults([]);
      }
    }, 300);
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    setUserSearch(u.email);
    setShowUserResults(false);
    setActiveIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (showUserResults && userResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, userResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        selectUser(userResults[activeIndex]);
      } else if (e.key === 'Escape') {
        setShowUserResults(false);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleInvite();
    }
  };

  const removeSelectedUser = () => {
    setSelectedUser(null);
    setUserSearch('');
    setUserResults([]);
    if (inputRef.current) inputRef.current.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowUserResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: C.dark }}>Invitar Participante</h3>
              </div>
              <div ref={searchRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
                      width: '100%', minHeight: '44px', border: '1.5px solid ' + (showUserResults ? C.gold : C.border),
                      borderRadius: '10px', padding: selectedUser ? '4px 8px' : '0 14px',
                      fontSize: '0.88rem', background: C.bg, color: C.dark, boxSizing: 'border-box',
                      transition: 'border-color 0.15s', cursor: 'text',
                    }}
                      onClick={() => inputRef.current?.focus()}
                    >
                      {selectedUser ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: C.goldBg, borderRadius: '20px', padding: '4px 8px 4px 10px',
                          fontSize: '13px',
                        }}>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%', background: C.goldLight,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '10px', color: '#fff', flexShrink: 0,
                          }}>
                            {selectedUser.nombre_completo?.[0]?.toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: C.dark }}>{selectedUser.nombre_completo}</span>
                          <button onClick={(e) => { e.stopPropagation(); removeSelectedUser(); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 0, display: 'flex' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                          </button>
                        </div>
                      ) : null}
                      <input
                        ref={inputRef}
                        type="text" value={selectedUser ? '' : userSearch}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedUser ? '' : 'Nombre o correo del revisor...'}
                        onFocus={() => { if (userResults.length > 0) setShowUserResults(true); }}
                        style={{
                          flex: 1, border: 'none', outline: 'none', background: 'transparent',
                          fontSize: '0.88rem', color: C.dark, padding: selectedUser ? '4px 0' : '0',
                          minWidth: '80px', height: selectedUser ? '30px' : '44px',
                        }}
                      />
                    </div>
                    {showUserResults && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                        background: '#fff', border: '1px solid ' + C.border, borderRadius: '10px',
                        marginTop: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '240px', overflowY: 'auto',
                      }}>
                        {userResults.map((u, idx) => (
                          <div key={u.id} onClick={() => selectUser(u)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                              cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid ' + C.bg,
                              background: idx === activeIndex ? C.goldBg : '#fff',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={() => setActiveIndex(idx)}
                          >
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%', background: C.goldLight,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '12px', color: '#fff', flexShrink: 0,
                            }}>
                              {(u.nombre_completo || u.nombres || '?')[0]?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: C.dark }}>{u.nombre_completo || u.nombres + ' ' + u.apellidos}</div>
                              <div style={{ fontSize: '11px', color: C.textMuted }}>{u.email} · {u.rol}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedUser && (
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.textMuted }}>
                        Presiona <strong>Enter</strong> para invitar o escribe otro nombre
                      </p>
                    )}
                  </div>
                  <button onClick={handleInvite} disabled={inviteLoading || (!selectedUser && userSearch.trim().length < 3)} style={{
                    height: '44px', padding: '0 22px', background: C.dark, color: '#fff',
                    border: 'none', borderRadius: '10px', fontWeight: 600, cursor: inviteLoading ? 'wait' : (selectedUser || userSearch.trim().length >= 3) ? 'pointer' : 'default', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '6px', opacity: inviteLoading ? 0.6 : (selectedUser || userSearch.trim().length >= 3) ? 1 : 0.4,
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={(e) => { if (!inviteLoading && (selectedUser || userSearch.trim().length >= 3)) e.currentTarget.style.background = '#2C3E50'; }}
                    onMouseLeave={(e) => { if (!inviteLoading) e.currentTarget.style.background = C.dark; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
                    {inviteLoading ? 'Enviando...' : 'Invitar'}
                  </button>
                </div>
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
