import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children, userName, userInitials, userRole, notifCount, profile }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;