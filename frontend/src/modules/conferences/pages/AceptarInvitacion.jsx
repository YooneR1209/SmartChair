import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { conferencias } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';

const C = {
  dark: '#1A1A2E', goldLight: '#C49B2C', gold: '#9A6F00',
  goldBg: '#FFF8E1', border: '#E5E8EB', textMuted: '#9CA3AF',
  bg: '#F5F7FA', green: '#1E8449', red: '#C0392B',
};

export default function AceptarInvitacion() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await conferencias.aceptarInvitacion(token);
        setDone(true);
        addToast('Invitación aceptada correctamente.', 'success');
      } catch (err) {
        setError(err.message || 'Error al aceptar la invitación.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg, padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '40px',
        maxWidth: '440px', width: '100%', textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: loading ? '#E3F2FD' : done ? 'rgba(30,132,73,0.1)' : 'rgba(192,57,43,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '28px',
            color: loading ? '#1565C0' : done ? C.green : C.red,
          }}>
            {loading ? 'schedule' : done ? 'check_circle' : 'error'}
          </span>
        </div>

        {loading && (
          <>
            <h2 style={{ margin: '0 0 8px', color: C.dark, fontWeight: 700 }}>Aceptando invitación...</h2>
            <p style={{ margin: 0, color: C.textMuted, fontSize: '14px' }}>Por favor espera un momento.</p>
          </>
        )}

        {done && (
          <>
            <h2 style={{ margin: '0 0 8px', color: C.green, fontWeight: 700 }}>Invitación aceptada</h2>
            <p style={{ margin: '0 0 24px', color: C.textMuted, fontSize: '14px' }}>
              Ya formas parte de la conferencia como revisor.
            </p>
            <button onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 32px', background: C.dark, color: '#fff',
                border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Ir al Dashboard
            </button>
          </>
        )}

        {error && (
          <>
            <h2 style={{ margin: '0 0 8px', color: C.red, fontWeight: 700 }}>Error</h2>
            <p style={{ margin: '0 0 24px', color: C.textMuted, fontSize: '14px' }}>{error}</p>
            <button onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 32px', background: C.dark, color: '#fff',
                border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Ir al Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
