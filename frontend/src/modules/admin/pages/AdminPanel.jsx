import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { conferencias, admin } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';
import { emit } from '../../../shared/services/events';
import CreateConferenceModal from '../../conferences/components/CreateConferenceModal';

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

const BADGE_MAP = {
  abierta: { bg: '#E8F5E9', color: C.green },
  activa: { bg: '#E8F5E9', color: C.green },
  cerrada: { bg: '#FDEDEC', color: C.red },
  borrador: { bg: '#F0F0F0', color: C.textSecondary },
  en_revision: { bg: C.goldBg, color: C.gold },
  archivada: { bg: '#E8E8E8', color: '#4A4A4A' },
  postulada: { bg: '#E3F2FD', color: C.blue },
  aceptada: { bg: '#E8F5E9', color: C.green },
  aceptada_con_cambios: { bg: C.goldBg, color: C.gold },
  rechazada: { bg: '#FDEDEC', color: C.red },
  activo: { bg: '#E8F5E9', color: C.green },
  inactivo: { bg: '#FDEDEC', color: C.red },
  completado: { bg: '#E8F5E9', color: C.green },
  pendiente: { bg: C.goldBg, color: C.gold },
  fallido: { bg: '#FDEDEC', color: C.red },
  reembolsado: { bg: '#F0F0F0', color: C.textSecondary },
};

function Badge({ estado }) {
  const s = BADGE_MAP[estado] || { bg: '#F0F0F0', color: C.textSecondary };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
      background: s.bg, color: s.color, textTransform: 'capitalize',
    }}>
      {estado ? estado.replace(/_/g, ' ') : '—'}
    </span>
  );
}

const sectionHeader = {
  margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: C.dark,
  display: 'flex', alignItems: 'center', gap: '8px',
};

const cardStyle = {
  background: '#FFFFFF', border: '1px solid ' + C.border, borderRadius: '12px', padding: '20px',
};

const tableHeaderStyle = {
  display: 'grid', gap: '8px', padding: '14px 18px', background: '#FFFFFF',
  borderBottom: '2px solid ' + C.goldLight, fontSize: '11px', fontWeight: 700, color: C.dark,
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

const rowStyle = {
  display: 'grid', gap: '8px', padding: '14px 18px', borderBottom: '1px solid ' + C.border,
  alignItems: 'center', fontSize: '13px', transition: 'all 0.12s',
};

const rowAlt = {
  ...rowStyle, background: '#FAFBFC',
};

const inputStyle = {
  padding: '8px 12px', border: '1px solid ' + C.border, borderRadius: '8px', fontSize: '13px',
  color: C.dark, outline: 'none', width: '100%', boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle, cursor: 'pointer', appearance: 'auto',
};

const btnBase = {
  padding: '6px 14px', fontSize: '12px', fontWeight: 600, border: '1px solid ' + C.border,
  borderRadius: '8px', background: '#FFFFFF', cursor: 'pointer', transition: 'all 0.15s',
};

function AdminPanel() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'resumen');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'resumen';
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [confs, setConfs] = useState([]);
  const [confsLoading, setConfsLoading] = useState(true);
  const [confsError, setConfsError] = useState('');

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [postsFilter, setPostsFilter] = useState({ conferencia: '', estado: '', area_tematica: '' });

  const [pagos, setPagos] = useState([]);
  const [pagosLoading, setPagosLoading] = useState(true);
  const [pagosError, setPagosError] = useState('');
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState(null);
  const [confirmDeletePonencia, setConfirmDeletePonencia] = useState(null);
  const [editConference, setEditConference] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchStats = () => {
    setStatsLoading(true);
    setStatsError('');
    admin.stats()
      .then(setStats)
      .catch((e) => { setStatsError(e.message); addToast(e.message, 'error'); })
      .finally(() => setStatsLoading(false));
  };

  const fetchUsers = (search) => {
    setUsersLoading(true);
    setUsersError('');
    admin.usuarios(search || '')
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((e) => { setUsersError(e.message); addToast(e.message, 'error'); })
      .finally(() => setUsersLoading(false));
  };

  const fetchConfs = () => {
    setConfsLoading(true);
    setConfsError('');
    conferencias.listar()
      .then((data) => setConfs(Array.isArray(data) ? data : []))
      .catch((e) => { setConfsError(e.message); addToast(e.message, 'error'); })
      .finally(() => setConfsLoading(false));
  };

  const fetchPosts = (filters) => {
    setPostsLoading(true);
    setPostsError('');
    const clean = {};
    Object.entries(filters || {}).forEach(([k, v]) => { if (v) clean[k] = v; });
    admin.postulaciones(clean)
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch((e) => { setPostsError(e.message); addToast(e.message, 'error'); })
      .finally(() => setPostsLoading(false));
  };

  const fetchPagos = () => {
    setPagosLoading(true);
    setPagosError('');
    admin.pagos()
      .then((data) => setPagos(Array.isArray(data) ? data : []))
      .catch((e) => { setPagosError(e.message); addToast(e.message, 'error'); })
      .finally(() => setPagosLoading(false));
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchConfs();
    fetchPosts();
    fetchPagos();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchUsers(searchTerm); }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRolChange = (userId, newRol) => {
    admin.cambiarRol(userId, newRol)
      .then(() => { addToast('Rol actualizado correctamente', 'success'); fetchUsers(searchTerm); })
      .catch((e) => addToast(e.message, 'error'));
  };

  const handleToggleEstado = (userId) => {
    admin.toggleEstado(userId)
      .then(() => { addToast('Estado de usuario actualizado', 'success'); fetchUsers(searchTerm); })
      .catch((e) => addToast(e.message, 'error'));
  };

  const handleEliminarConf = (slug) => {
    setConfirmDeleteSlug(null);
    conferencias.eliminar(slug)
      .then(() => { addToast('Conferencia eliminada', 'success'); fetchConfs(); })
      .catch((e) => addToast(e.message, 'error'));
  };

  const handleEliminarPonencia = (id) => {
    setConfirmDeletePonencia(null);
    conferencias.eliminarPonencia(id)
      .then(() => { addToast('Ponencia eliminada', 'success'); fetchPosts(postsFilter); })
      .catch((e) => addToast(e.message, 'error'));
  };

  const handleConfSaved = async () => {
    setShowEditModal(false);
    setEditConference(null);
    fetchConfs();
    emit('conferencia:actualizada');
  };

  const handlePostFilter = (key, value) => {
    const next = { ...postsFilter, [key]: value };
    setPostsFilter(next);
    fetchPosts(next);
  };

  const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  };

  const formatDateTime = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  };

  const rolesDisponibles = ['administrador', 'organizador', 'revisor', 'autor'];
  const estadoOptions = ['', 'postulada', 'en_revision', 'aceptada', 'rechazada', 'aceptada_con_cambios'];
  const confOptions = [{ value: '', label: 'Todas' }, ...confs.map((c) => ({ value: c.slug || c.id, label: c.nombre }))];

  const loadingSpinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: C.textMuted, fontSize: '14px', gap: '8px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 0.8s linear infinite' }}>sync</span>
      Cargando...
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  const emptyState = (icon, msg) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px 0' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#D0D0D0' }}>{icon}</span>
      <p style={{ fontSize: '14px', color: C.textSecondary, margin: 0 }}>{msg}</p>
    </div>
  );

  const statCards = stats ? [
    {
      label: 'Total Usuarios', value: stats.total_usuarios ?? '—', sub: `Activos: ${stats.usuarios_activos ?? 0}`,
      icon: 'people',
    },
    {
      label: 'Conferencias', value: stats.total_conferencias ?? '—', sub: null,
      icon: 'calendar_month',
    },
    {
      label: 'Postulaciones', value: stats.total_ponencias ?? '—', sub: null,
      icon: 'description',
    },
    {
      label: 'Pagos', value: stats.total_pagos ?? '—', sub: `Completados: ${stats.pagos_completados ?? 0}`,
      icon: 'payments',
    },
    {
      label: 'Roles', value: null, sub: null,
      icon: 'badge',
      custom: stats.roles_count ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
          {Object.entries(stats.roles_count).map(([rol, count]) => (
            <div key={rol} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMuted }}>
              <span style={{ textTransform: 'capitalize' }}>{rol}</span>
              <span style={{ fontWeight: 700, color: C.dark }}>{count}</span>
            </div>
          ))}
        </div>
      ) : null,
    },
    {
      label: 'Usuarios Activos', value: stats.usuarios_activos ?? '—', sub: null,
      icon: 'group',
    },
  ] : [];

  return (
    <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: C.textMuted, marginBottom: '6px' }}>
          Inicio {'>'} Panel de Administración
        </div>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: C.dark, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '30px', color: C.goldLight }}>admin_panel_settings</span>
          Panel de Administración
        </h1>
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '4px', background: C.bg, borderRadius: '10px', padding: '4px', marginBottom: '4px' }}>
        {[
          { key: 'resumen', icon: 'dashboard', label: 'Resumen' },
          { key: 'usuarios', icon: 'people', label: 'Usuarios' },
          { key: 'conferencias', icon: 'event', label: 'Conferencias' },
          { key: 'postulaciones', icon: 'description', label: 'Postulaciones' },
          { key: 'pagos', icon: 'payments', label: 'Pagos' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => handleTabChange(tab.key)}
            style={{
              flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px',
              background: activeTab === tab.key ? C.dark : 'transparent',
              color: activeTab === tab.key ? '#fff' : C.textSecondary,
              cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.background = C.bg; }}
            onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.background = 'transparent'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {(activeTab === 'resumen') && (
      <div>
        <div style={sectionHeader}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.goldLight }}>dashboard</span>
          Resumen del Sistema
        </div>
        {statsLoading ? loadingSpinner() : statsError ? (
          <div style={{ textAlign: 'center', padding: '24px', color: C.red, fontSize: '13px' }}>Error al cargar estadísticas. <button onClick={fetchStats} style={{ background: 'none', border: 'none', color: C.goldLight, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button></div>
        ) : (
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {statCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: '#FFFFFF', borderLeft: `4px solid ${C.goldLight}`, border: '1px solid ' + C.border, borderLeftWidth: '4px',
                  borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {card.label}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: C.goldLight }}>{card.icon}</span>
                </div>
                {card.custom ? card.custom : (
                  <span style={{ fontSize: '28px', fontWeight: 800, color: C.dark, lineHeight: 1 }}>
                    {card.value}
                  </span>
                )}
                {card.sub && (
                  <span style={{ fontSize: '11px', color: C.textMuted }}>{card.sub}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {(activeTab === 'usuarios') && (
      <div style={cardStyle}>
        <div style={sectionHeader}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.goldLight }}>manage_accounts</span>
          Gestión de Usuarios
        </div>
        <div style={{ marginBottom: '16px' }}>
          <input
            style={{ ...inputStyle, maxWidth: '360px' }}
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {usersLoading ? loadingSpinner() : usersError ? (
          <div style={{ textAlign: 'center', padding: '24px', color: C.red, fontSize: '13px' }}>Error al cargar usuarios. <button onClick={() => fetchUsers(searchTerm)} style={{ background: 'none', border: 'none', color: C.goldLight, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button></div>
        ) : users.length === 0 ? (
          emptyState('person_search', 'No hay usuarios registrados.')
        ) : (
          <div className="table-scroll" style={{ border: '1px solid ' + C.border, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ ...tableHeaderStyle, gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1.2fr 1fr' }}>
              <span>Nombre</span>
              <span>Email</span>
              <span>Rol</span>
              <span>Estado</span>
              <span>Fecha Registro</span>
              <span style={{ textAlign: 'center' }}>Acciones</span>
            </div>
            {users.map((u, idx) => (
              <div key={u.id} style={{ ...(idx % 2 === 0 ? rowStyle : rowAlt), gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1.2fr 1fr' }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.goldBg}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFBFC'}>
                <span style={{ fontWeight: 600, color: C.dark }}>{u.nombre || u.username || '—'}</span>
                <span style={{ color: C.textSecondary }}>{u.email || '—'}</span>
                <select
                  style={{ ...selectStyle, width: 'auto', minWidth: '130px' }}
                  value={u.rol || ''}
                  onChange={(e) => handleRolChange(u.id, e.target.value)}
                >
                  {rolesDisponibles.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
                <Badge estado={u.is_active ? 'activo' : 'inactivo'} />
                <span style={{ color: C.textSecondary, fontSize: '12px' }}>{formatDate(u.fecha_registro || u.date_joined)}</span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    style={{ ...btnBase, color: u.is_active ? C.red : C.green, borderColor: u.is_active ? C.red : C.green }}
                    onClick={() => handleToggleEstado(u.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = u.is_active ? C.red : C.green; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = u.is_active ? C.red : C.green; }}
                  >
                    {u.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {(activeTab === 'conferencias') && (
      <div style={cardStyle}>
        <div style={sectionHeader}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.goldLight }}>event</span>
          Gestión de Conferencias
        </div>
        {confsLoading ? loadingSpinner() : confsError ? (
          <div style={{ textAlign: 'center', padding: '24px', color: C.red, fontSize: '13px' }}>Error al cargar conferencias. <button onClick={fetchConfs} style={{ background: 'none', border: 'none', color: C.goldLight, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button></div>
        ) : confs.length === 0 ? (
          emptyState('calendar_month', 'No hay conferencias registradas.')
        ) : (
          <div className="table-scroll" style={{ border: '1px solid ' + C.border, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ ...tableHeaderStyle, gridTemplateColumns: '2fr 2fr 1fr 120px' }}>
              <span>Nombre</span>
              <span>Fechas</span>
              <span>Estado</span>
              <span style={{ textAlign: 'center' }}>Acciones</span>
            </div>
            {confs.map((conf, idx) => (
              <div key={conf.id || conf.slug} style={{ ...(idx % 2 === 0 ? rowStyle : rowAlt), gridTemplateColumns: '2fr 2fr 1fr 120px' }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.goldBg}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFBFC'}>
                <span style={{ fontWeight: 600, color: C.dark }}>{conf.nombre}</span>
                <span style={{ color: C.textSecondary, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: C.textMuted }}>schedule</span>
                  {formatDate(conf.fecha_inicio)} — {formatDate(conf.fecha_fin)}
                </span>
                <Badge estado={conf.estado} />
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button
                    style={{ ...btnBase, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => { setEditConference(conf); setShowEditModal(true); }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.goldLight; e.currentTarget.style.color = C.gold; e.currentTarget.style.background = C.goldBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dark; e.currentTarget.style.background = '#fff'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                  </button>
                  <button
                    style={{ ...btnBase, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px', color: C.red, borderColor: C.red }}
                    onClick={() => setConfirmDeleteSlug(conf.slug)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF5F5'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {(activeTab === 'postulaciones') && (
      <div style={cardStyle}>
        <div style={sectionHeader}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.goldLight }}>description</span>
          Postulaciones
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', background: C.bg, padding: '12px 14px', borderRadius: '10px', border: '1px solid ' + C.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: C.textMuted }}>filter_alt</span>
          </div>
          <select
            style={{ ...selectStyle, width: 'auto', minWidth: '150px', padding: '6px 10px', fontSize: '12px' }}
            value={postsFilter.conferencia}
            onChange={(e) => handlePostFilter('conferencia', e.target.value)}
          >
            {confOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            style={{ ...selectStyle, width: 'auto', minWidth: '140px', padding: '6px 10px', fontSize: '12px' }}
            value={postsFilter.estado}
            onChange={(e) => handlePostFilter('estado', e.target.value)}
          >
            <option value="">Todos los estados</option>
            {estadoOptions.filter(Boolean).map((e) => (
              <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input
            style={{ ...inputStyle, width: 'auto', minWidth: '160px', padding: '6px 10px', fontSize: '12px' }}
            placeholder="Área temática..."
            value={postsFilter.area_tematica}
            onChange={(e) => handlePostFilter('area_tematica', e.target.value)}
          />
        </div>
        {postsLoading ? loadingSpinner() : postsError ? (
          <div style={{ textAlign: 'center', padding: '24px', color: C.red, fontSize: '13px' }}>Error al cargar postulaciones. <button onClick={() => fetchPosts(postsFilter)} style={{ background: 'none', border: 'none', color: C.goldLight, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button></div>
        ) : posts.length === 0 ? (
          emptyState('description', 'No hay postulaciones registradas.')
        ) : (
          <div className="table-scroll" style={{ border: '1px solid ' + C.border, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ ...tableHeaderStyle, gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 60px' }}>
              <span>Título</span>
              <span>Autor</span>
              <span>Área</span>
              <span>Estado</span>
              <span>Fecha</span>
              <span style={{ textAlign: 'center' }}>Acción</span>
            </div>
            {posts.map((p, idx) => (
              <div key={p.id} style={{ ...(idx % 2 === 0 ? rowStyle : rowAlt), gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 60px' }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.goldBg}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFBFC'}>
                <span style={{ fontWeight: 600, color: C.dark }}>{p.titulo || '—'}</span>
                <span style={{ color: C.textSecondary, fontSize: '12px' }}>{p.autor_nombre || p.autor || '—'}</span>
                <span style={{ color: C.textSecondary, fontSize: '12px' }}>{p.area_tematica || '—'}</span>
                <Badge estado={p.estado} />
                <span style={{ color: C.textSecondary, fontSize: '12px' }}>{formatDateTime(p.postulada_en || p.fecha_creacion || p.created_at)}</span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    style={{ ...btnBase, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: C.red, borderColor: C.red }}
                    onClick={() => setConfirmDeletePonencia(p.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF5F5'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {(activeTab === 'pagos') && (
      <div style={cardStyle}>
        <div style={sectionHeader}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.goldLight }}>payments</span>
          Pagos
        </div>
        {pagosLoading ? loadingSpinner() : pagosError ? (
          <div style={{ textAlign: 'center', padding: '24px', color: C.red, fontSize: '13px' }}>Error al cargar pagos. <button onClick={fetchPagos} style={{ background: 'none', border: 'none', color: C.goldLight, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button></div>
        ) : pagos.length === 0 ? (
          emptyState('payments', 'No hay pagos registrados.')
        ) : (
          <div className="table-scroll" style={{ border: '1px solid ' + C.border, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ ...tableHeaderStyle, gridTemplateColumns: '1.5fr 1fr 1.2fr 1.5fr 1.2fr' }}>
              <span>Usuario</span>
              <span>Monto</span>
              <span>Estado</span>
              <span>Referencia</span>
              <span>Fecha</span>
            </div>
            {pagos.map((p, idx) => (
              <div key={p.id} style={{ ...(idx % 2 === 0 ? rowStyle : rowAlt), gridTemplateColumns: '1.5fr 1fr 1.2fr 1.5fr 1.2fr' }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.goldBg}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFBFC'}>
                <span style={{ fontWeight: 600, color: C.dark }}>{p.usuario || p.usuario_nombre || '—'}</span>
                <span style={{ fontWeight: 700, color: C.dark }}>
                  {p.monto != null ? `$${Number(p.monto).toFixed(2)}` : '—'}
                </span>
                <Badge estado={p.estado} />
                <span style={{ color: C.textSecondary, fontSize: '12px', wordBreak: 'break-all' }}>
                  {p.referencia_tipo ? `${p.referencia_tipo} #${p.referencia_id || ''}` : '—'}
                </span>
                <span style={{ color: C.textSecondary, fontSize: '12px' }}>{formatDateTime(p.creado_en)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {confirmDeleteSlug && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }} onClick={() => setConfirmDeleteSlug(null)}>
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '400px', width: '90%',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: C.dark }}>¿Eliminar conferencia?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: C.textSecondary, lineHeight: 1.5 }}>
              Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta conferencia?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteSlug(null)}
                style={{ padding: '8px 16px', border: '1px solid ' + C.border, borderRadius: '8px', background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={() => handleEliminarConf(confirmDeleteSlug)}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: C.red, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeletePonencia && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }} onClick={() => setConfirmDeletePonencia(null)}>
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '400px', width: '90%',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: C.dark }}>¿Eliminar ponencia?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: C.textSecondary, lineHeight: 1.5 }}>
              Se eliminarán también las revisiones, veredictos, respuestas y pagos asociados. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeletePonencia(null)}
                style={{ padding: '8px 16px', border: '1px solid ' + C.border, borderRadius: '8px', background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={() => handleEliminarPonencia(confirmDeletePonencia)}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: C.red, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <CreateConferenceModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditConference(null); }}
          conference={editConference}
          onSaved={handleConfSaved}
        />
      )}
    </div>
  );
}

export default AdminPanel;
