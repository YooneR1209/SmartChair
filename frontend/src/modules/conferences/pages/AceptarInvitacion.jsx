import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { conferencias } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';

const C = {
  dark: '#1A1A2E', goldLight: '#D4AC0D', gold: '#9A6F00',
  goldBg: '#FEF9E7', border: '#E5E8EB', textSecondary: '#5D6D7E',
  textMuted: '#9CA3AF', bg: '#F5F7FA', green: '#1E8449', red: '#C0392B', blue: '#1565C0',
};

export default function AceptarInvitacion() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState('confirm'); // confirm | loading | done | error
  const [error, setError] = useState('');

  const handleAccept = async () => {
    setStep('loading');
    try {
      await conferencias.aceptarInvitacion(token);
      setStep('done');
      addToast('Invitación aceptada correctamente.', 'success');
    } catch (err) {
      setError(err.message || 'Error al aceptar la invitación.');
      setStep('error');
    }
  };

  const handleCancel = () => {
    addToast('Invitación rechazada.', 'info');
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${C.bg} 0%, #fff 100%)`,
      padding: '20px',
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div style={{
        background: '#fff', borderRadius: '20px', padding: '40px 36px',
        maxWidth: '460px', width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        animation: 'fadeSlideUp 0.3s ease-out',
      }}>
        {/* Confirm step */}
        {step === 'confirm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: C.goldBg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: C.gold }}>mail</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 6px', color: C.dark, fontWeight: 700, fontSize: '22px' }}>
                Invitación pendiente
              </h2>
              <p style={{ margin: 0, color: C.textSecondary, fontSize: '14px', lineHeight: 1.6 }}>
                Has recibido una invitación para participar como <strong>revisor</strong> en una conferencia.
                ¿Deseas aceptarla?
              </p>
            </div>

            <div style={{
              padding: '16px', borderRadius: '12px', background: C.bg,
              border: '1px solid ' + C.border, display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: C.goldBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: C.gold }}>info</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: C.textSecondary, lineHeight: 1.5 }}>
                Al aceptar, podrás revisar ponencias asignadas y emitir veredictos.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleCancel}
                style={{
                  flex: 1, padding: '14px', background: '#fff', color: C.dark,
                  border: '1.5px solid ' + C.border, borderRadius: '12px',
                  fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dark; }}
              >
                Cancelar
              </button>
              <button onClick={handleAccept}
                style={{
                  flex: 1, padding: '14px', background: C.green, color: '#fff',
                  border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1B6F3D'}
                onMouseLeave={(e) => e.currentTarget.style.background = C.green}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                Aceptar Invitación
              </button>
            </div>
          </div>
        )}

        {/* Loading step */}
        {step === 'loading' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#E3F2FD', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <div style={{
                width: 24, height: 24, border: '3px solid rgba(21,101,192,0.2)',
                borderTopColor: C.blue, borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
            <h2 style={{ margin: '0 0 8px', color: C.dark, fontWeight: 700 }}>Aceptando invitación...</h2>
            <p style={{ margin: 0, color: C.textMuted, fontSize: '14px' }}>Por favor espera un momento.</p>
            <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(30,132,73,0.1)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: C.green }}>check_circle</span>
            </div>
            <h2 style={{ margin: '0 0 6px', color: C.green, fontWeight: 700, fontSize: '20px' }}>
              Invitación aceptada
            </h2>
            <p style={{ margin: '0 0 28px', color: C.textSecondary, fontSize: '14px' }}>
              Ya eres revisor de esta conferencia. Puedes empezar a revisar ponencias desde tu panel.
            </p>
            <button onClick={() => navigate('/dashboard')}
              style={{
                padding: '13px 36px', background: C.dark, color: '#fff',
                border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2C3E50'}
              onMouseLeave={(e) => e.currentTarget.style.background = C.dark}
            >
              Ir al Dashboard
            </button>
          </div>
        )}

        {/* Error step */}
        {step === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(192,57,43,0.08)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: C.red }}>error</span>
            </div>
            <h2 style={{ margin: '0 0 6px', color: C.red, fontWeight: 700, fontSize: '20px' }}>
              Error
            </h2>
            <p style={{ margin: '0 0 28px', color: C.textSecondary, fontSize: '14px' }}>{error}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setStep('confirm')}
                style={{
                  padding: '13px 24px', background: '#fff', color: C.dark,
                  border: '1px solid ' + C.border, borderRadius: '10px',
                  fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                }}
              >
                Reintentar
              </button>
              <button onClick={() => navigate('/dashboard')}
                style={{
                  padding: '13px 24px', background: C.dark, color: '#fff',
                  border: 'none', borderRadius: '10px', fontWeight: 600,
                  fontSize: '14px', cursor: 'pointer',
                }}
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}