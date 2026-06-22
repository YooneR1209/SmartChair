import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const COLORS = {
    success: { bg: '#E8F5E9', border: '#1E8449', icon: 'check_circle', iconColor: '#1E8449' },
    error: { bg: '#FDEDEC', border: '#C0392B', icon: 'error', iconColor: '#C0392B' },
    info: { bg: '#EBF5FB', border: '#2980B9', icon: 'info', iconColor: '#2980B9' },
    warning: { bg: '#FEF9E7', border: '#D4AC0D', icon: 'warning', iconColor: '#D4AC0D' },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed', top: '16px', right: '16px', zIndex: 10000,
        display: 'flex', flexDirection: 'column', gap: '8px',
        maxWidth: '400px',
      }}>
        {toasts.map((t) => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} style={{
              background: c.bg, border: `1px solid ${c.border}`,
              borderLeft: `4px solid ${c.border}`,
              borderRadius: '8px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              animation: 'slideIn 0.25s ease-out',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: c.iconColor, flexShrink: 0 }}>
                {c.icon}
              </span>
              <span style={{ fontSize: '14px', color: '#2C3E50', flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              <button onClick={() => removeToast(t.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9CA3AF',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
