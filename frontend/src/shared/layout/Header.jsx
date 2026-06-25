import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { notifications, admin, conferencias, reviews, postulaciones } from '../services/api';
import { useToast } from '../components/ToastContext';

const NOTIF_STYLES = {
  exito: { bg: '#E8F5E9', border: '#1E8449', dot: '#1E8449', icon: 'check_circle' },
  info: { bg: '#E3F2FD', border: '#1565C0', dot: '#1565C0', icon: 'info' },
  alerta: { bg: '#FFF3E0', border: '#E67E22', dot: '#E67E22', icon: 'warning' },
  error: { bg: '#FFEBEE', border: '#C0392B', dot: '#C0392B', icon: 'error' },
};

function NotificationPanel({ onClose }) {
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await notifications.listar();
        const notifs = data?.notificaciones || data?.results || data || [];
        if (Array.isArray(notifs) && notifs.length > 0) {
          const mapped = notifs.map(n => ({
            id: n.id,
            type: n.tipo === 'invitacion_revisor' || n.tipo === 'asignacion_revisor' ? 'alerta' : 'info',
            message: n.titulo,
            description: n.mensaje || '',
            time: n.creado_en ? new Date(n.creado_en).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Ahora',
            link: n.link,
            leida: n.leida,
          }));
          setItems(mapped);
          setLoading(false);
          return;
        }
      } catch { /* stats fallback */ }

      const profileRaw = localStorage.getItem('profile');
      let role = 'AUTOR';
      if (profileRaw) {
        try {
          const p = JSON.parse(profileRaw);
          const pr = (p.rol || '').toUpperCase();
          if (pr) role = pr;
        } catch { /* */ }
      }
      const selected = localStorage.getItem('selectedRole');
      if (selected) role = selected;

      const list = [];
      try {
        if (role === 'ADMINISTRADOR') {
          const stats = await admin.stats();
          if (stats.total_usuarios != null) list.push({ type: 'info', message: `${stats.total_usuarios} usuarios registrados.`, time: 'Ahora' });
          if (stats.total_conferencias != null) list.push({ type: 'info', message: `${stats.total_conferencias} conferencias.`, time: 'Ahora' });
          if (stats.total_ponencias != null) list.push({ type: 'alerta', message: `${stats.total_ponencias} postulaciones.`, time: 'Ahora' });
          if (stats.pagos_completados != null) list.push({ type: 'exito', message: `${stats.pagos_completados} pagos completados.`, time: 'Ahora' });
        }
        if (role === 'ORGANIZADOR') {
          const confs = await conferencias.listar();
          const arr = Array.isArray(confs) ? confs : [];
          let sinAsignar = 0;
          for (const c of arr) {
            try {
              const pons = await conferencias.listarPonencias(c.slug);
              if (Array.isArray(pons)) sinAsignar += pons.filter(p => p.estado === 'postulada').length;
            } catch { /* */ }
          }
          if (sinAsignar > 0) list.push({ type: 'alerta', message: `${sinAsignar} ponencia(s) sin asignar.`, time: 'Ahora' });
        }
        if (role === 'REVISOR') {
          const asigs = await reviews.misAsignaciones();
          const arr = Array.isArray(asigs) ? asigs : [];
          const pendientes = arr.filter(a => a.estado_revision !== 'completada').length;
          if (pendientes > 0) list.push({ type: 'alerta', message: `${pendientes} revisión(es) pendiente(s).`, time: 'Ahora' });
        }
        if (role === 'AUTOR') {
          const pons = await postulaciones.misPostulaciones();
          const arr = Array.isArray(pons) ? pons : [];
          const enRev = arr.filter(p => p.estado === 'en_revision').length;
          if (enRev > 0) list.push({ type: 'alerta', message: `${enRev} ponencia(s) en revisión.`, time: 'Ahora' });
        }
      } catch { /* */ }
      if (list.length === 0) list.push({ type: 'info', message: 'No hay notificaciones nuevas.', time: 'Ahora' });
      setItems(list);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={panelRef} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      width: '380px', background: '#FFFFFF', borderRadius: '12px',
      border: '1px solid #E5E8EB', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      zIndex: 10001, overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #E5E8EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E' }}>Notificaciones</span>
        <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>Hoy</span>
      </div>
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
          No hay notificaciones nuevas.
        </div>
      ) : (
        <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
          {items.map((n) => {
            const s = NOTIF_STYLES[n.type] || NOTIF_STYLES.info;
            return (
              <div key={n.id} style={{
                padding: '14px 18px', borderBottom: '1px solid #F0F0F0',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                transition: 'background 0.1s', cursor: n.link ? 'pointer' : 'default',
              }}
                onClick={() => { if (n.link) { navigate(n.link); onClose(); } }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FAFBFC'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: s.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: s.dot }}>{s.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#2C3E50', lineHeight: 1.4 }}>{n.message}</p>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>{n.time}</span>
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot, flexShrink: 0, marginTop: '4px' }} />
              </div>
            );
          })}
        </div>
      )}
      <div style={{ padding: '12px 18px', borderTop: '1px solid #E5E8EB', textAlign: 'center' }}>
        <button style={{
          background: 'none', border: 'none', color: '#9A6F00', fontWeight: 600,
          fontSize: '12px', cursor: 'pointer',
        }}
          onClick={async () => {
            try {
              await notifications.marcarTodasLeidas();
              setItems(prev => prev.map(n => ({ ...n, leida: true })));
            } catch { /* */ }
            onClose();
          }}>
          Marcar todas como leídas
        </button>
      </div>
    </div>
  );
}

function Header({ userInitials = 'SC', notifCount: notifCountProp = 0, onToggleSidebar, profile }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const bellRef = useRef(null);

  const fetchUnreadCount = () => {
    notifications.listar()
      .then(data => {
        const count = data?.no_leidas ?? data?.unread ?? 0;
        setUnreadCount(count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showNotifs) fetchUnreadCount();
  }, [showNotifs]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    localStorage.removeItem('selectedRole');
    addToast('Sesión cerrada correctamente', 'info');
    navigate('/login');
  };

  return (
    <div
      className="layout-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 32px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E8EAED',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <button
          className="hamburger-btn"
          onClick={onToggleSidebar}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: '#F5F7FA',
            color: '#5D6D7E',
          }}
          aria-label="Menú"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>menu</span>
        </button>
        <div
          className="header-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: '#F5F7FA',
            border: '1px solid #E8EAED',
            width: '280px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#5D6D7E' }}>search</span>
          <input
            type="text"
            placeholder="Buscar ponencias..."
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
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs((v) => !v)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: showNotifs ? '#F0F0F5' : 'none',
              transition: 'background 0.1s',
            }}
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#5D6D7E' }}>notifications</span>
            {!showNotifs && unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#C0392B',
                  color: '#FFF',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '0 4px',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        </div>

        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#9A6F00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px',
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          title="Cerrar sesión"
          onClick={handleLogout}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {userInitials}
        </div>
      </div>
    </div>
  );
}

export default Header;
