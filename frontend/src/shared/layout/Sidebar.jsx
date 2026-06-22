import { useNavigate, useLocation } from 'react-router';

const roleMenuConfig = {
  AUTOR: [
    { items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
      { label: 'Mis Ponencias', path: '/mis-ponencias', icon: 'description' },
      { label: 'Conferencias', path: '/conferencias', icon: 'groups' },
    ]},
    { section: 'Cuenta', items: [
      { label: 'Pagos', path: '/pagos', icon: 'payments' },
      { label: 'Certificados', path: '/certificados', icon: 'verified' },
      { label: 'Perfil', path: '/perfil', icon: 'person' },
    ]},
  ],
  REVISOR: [
    { items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
      { label: 'Mis Ponencias', path: '/mis-ponencias', icon: 'description' },
      { label: 'Conferencias', path: '/conferencias', icon: 'groups' },
      { label: 'Mis Revisiones', path: '/mis-revisiones', icon: 'rate_review' },
    ]},
    { section: 'Cuenta', items: [
      { label: 'Pagos', path: '/pagos', icon: 'payments' },
      { label: 'Certificados', path: '/certificados', icon: 'verified' },
      { label: 'Perfil', path: '/perfil', icon: 'person' },
    ]},
  ],
  ORGANIZADOR: [
    { items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
      { label: 'Mis Ponencias', path: '/mis-ponencias', icon: 'description' },
      { label: 'Mis Conferencias', path: '/conferencias', icon: 'groups' },
      { label: 'Gestionar Postulaciones', path: '/gestionar-postulaciones', icon: 'assignment' },
    ]},
    { section: 'Cuenta', items: [
      { label: 'Pagos', path: '/pagos', icon: 'payments' },
      { label: 'Certificados', path: '/certificados', icon: 'verified' },
      { label: 'Perfil', path: '/perfil', icon: 'person' },
    ]},
  ],
  ADMINISTRADOR: [
    { items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
      { label: 'Mis Ponencias', path: '/mis-ponencias', icon: 'description' },
      { label: 'Conferencias', path: '/conferencias', icon: 'groups' },
      { label: 'Gestionar Postulaciones', path: '/gestionar-postulaciones', icon: 'assignment' },
    ]},
    { section: 'Administración', items: [
      { label: 'Usuarios', path: '/admin?tab=usuarios', icon: 'group' },
      { label: 'Conferencias', path: '/admin?tab=conferencias', icon: 'event' },
      { label: 'Postulaciones', path: '/admin?tab=postulaciones', icon: 'description' },
      { label: 'Pagos', path: '/admin?tab=pagos', icon: 'payments' },
    ]},
    { section: 'Cuenta', items: [
      { label: 'Pagos', path: '/pagos', icon: 'payments' },
      { label: 'Certificados', path: '/certificados', icon: 'verified' },
      { label: 'Perfil', path: '/perfil', icon: 'person' },
    ]},
  ],
};

function Sidebar({ userName = 'Usuario', userInitials = 'SC', userRole = 'AUTOR', isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = roleMenuConfig[userRole] || roleMenuConfig.AUTOR;

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    const [base, query] = path.split('?');
    if (query) {
      return location.pathname.startsWith(base) && location.search === '?' + query;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('profile');
    localStorage.removeItem('selectedRole');
    navigate('/login', { replace: true });
  };

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <div
      className={`sidebar-desktop${isOpen ? ' open' : ''}`}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '240px',
        height: '100vh',
        background: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: '20px',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          padding: '24px 20px 0',
          marginBottom: '24px',
          cursor: 'pointer',
        }}
        onClick={() => handleNav('/dashboard')}
      >
        SmartChair
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 20px 16px',
          margin: '0 12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#D4AC0D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            color: '#1A1A2E',
            flexShrink: 0,
          }}
        >
          {userInitials}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.2',
            }}
          >
            {userName}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: '#D4AC0D',
              color: '#1A1A2E',
              padding: '2px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              alignSelf: 'flex-start',
              lineHeight: '1.4',
            }}
          >
            {userRole}
          </span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '0 12px' }}>
        {menuItems.map((group, idx) => (
          <div key={group.section || `group-${idx}`} style={{ marginBottom: 16 }}>
            {group.section && (
              <div
                style={{
                  padding: '0 12px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.path);
              return (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    background: active ? '#9A6F00' : 'transparent',
                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                    transition: 'background 0.15s, color 0.15s',
                    marginBottom: '1px',
                  }}
                  onClick={() => handleNav(item.path)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: '0 12px 24px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.65)',
            transition: 'background 0.15s',
          }}
          onClick={() => handleNav('/perfil')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
          <span>Configuración</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: '#C0392B',
            transition: 'background 0.15s',
          }}
          onClick={handleLogout}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          <span>Cerrar Sesión</span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
