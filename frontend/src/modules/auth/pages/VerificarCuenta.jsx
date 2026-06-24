import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { auth } from '../../../shared/services/api';

function VerificarCuenta() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verificando');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setDetail('Enlace de verificación inválido.');
      return;
    }
    auth.verificarEmail(token)
      .then((data) => {
        setStatus('exitoso');
        setDetail(data.detail || 'Correo verificado exitosamente.');
      })
      .catch((err) => {
        setStatus('error');
        setDetail(err.message || 'Error al verificar el correo.');
      });
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FDFAF2', padding: '24px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '48px 40px', maxWidth: '440px', width: '100%',
        textAlign: 'center', border: '1px solid #E8EAED', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        {status === 'verificando' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#D4AC0D' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>hourglass_empty</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2C3E50', marginBottom: '8px' }}>Verificando...</h2>
            <p style={{ color: '#5D6D7E', fontSize: '0.95rem' }}>Espera un momento mientras verificamos tu correo.</p>
          </>
        )}
        {status === 'exitoso' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#1E8449' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>check_circle</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2C3E50', marginBottom: '8px' }}>¡Correo Verificado!</h2>
            <p style={{ color: '#5D6D7E', fontSize: '0.95rem', marginBottom: '24px' }}>{detail}</p>
            <Link to="/login"
              style={{
                display: 'inline-block', padding: '12px 32px', borderRadius: '8px',
                background: '#1A1A2E', color: '#fff', fontWeight: 700, textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >Iniciar Sesión</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#E74C3C' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>error</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2C3E50', marginBottom: '8px' }}>Error de Verificación</h2>
            <p style={{ color: '#5D6D7E', fontSize: '0.95rem', marginBottom: '24px' }}>{detail}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/registro"
                style={{
                  display: 'inline-block', padding: '12px 24px', borderRadius: '8px',
                  background: '#1A1A2E', color: '#fff', fontWeight: 700, textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >Registrarse</Link>
              <Link to="/login"
                style={{
                  display: 'inline-block', padding: '12px 24px', borderRadius: '8px',
                  border: '1px solid #D0D0D0', color: '#2C3E50', fontWeight: 600, textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >Iniciar Sesión</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VerificarCuenta;
