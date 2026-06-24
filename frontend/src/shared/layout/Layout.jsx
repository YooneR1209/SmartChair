import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children, userName, userInitials, userRole, notifCount, profile }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      <Sidebar
        userName={userName}
        userInitials={userInitials}
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: 'rgba(0,0,0,0.4)',
            display: 'none',
          }}
        />
      )}
      <div
        className="layout-content"
        style={{
          marginLeft: '240px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Header
          userInitials={userInitials}
          notifCount={notifCount}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <main className="layout-main" style={{ flex: 1, padding: '32px 32px 32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span onClick={() => navigate(-1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#5D6D7E', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#D4AC0D'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#5D6D7E'}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Volver
            </span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;