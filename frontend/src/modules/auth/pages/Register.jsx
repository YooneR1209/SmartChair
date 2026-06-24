import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { auth } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';

function Register() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', nombres: '', apellidos: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    if (!form.email.trim() || !form.nombres.trim() || !form.apellidos.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      addToast('Todos los campos son obligatorios.', 'error');
      return false;
    }
    if (form.password.length < 8) {
      addToast('La contraseña debe tener al menos 8 caracteres.', 'error');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      addToast('Las contraseñas no coinciden.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await auth.registro({
        email: form.email,
        nombres: form.nombres,
        apellidos: form.apellidos,
        password: form.password,
        password2: form.confirmPassword,
      });
      addToast('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      addToast(err.message || 'Error al registrarse.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '40% 60%' }}>
      <section className="auth-left" style={{
        background: '#1A1A2E', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px', position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'url("https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1400&q=80") center/cover',
          opacity: 0.1, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '340px' }}>
          <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, display: 'block', marginBottom: '24px' }}>SmartChair</span>
          <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '12px' }}>
            Únete a la comunidad
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Crea tu cuenta y comienza a participar en conferencias académicas.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '3px solid #D4AC0D', paddingLeft: '16px' }}>
            {[
              { icon: 'description', text: 'Postula tus investigaciones' },
              { icon: 'groups', text: 'Participa como revisor' },
              { icon: 'track_changes', text: 'Da seguimiento a tus envíos' },
            ].map((item) => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.85)', fontSize: '0.92rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#D4AC0D' }}>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-right" style={{
        background: '#FDFAF2', display: 'flex', flexDirection: 'column',
        height: '100vh', padding: '48px 32px', position: 'relative',
      }}>
        <span onClick={() => navigate('/')}
          style={{ position: 'absolute', top: '24px', left: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#5D6D7E', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#D4AC0D'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#5D6D7E'}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Inicio
        </span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '100%', maxWidth: '420px', background: '#fff',
            border: '1px solid #E8EAED', borderRadius: '12px',
            padding: '36px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2C3E50', marginBottom: '8px' }}>Crear Cuenta</h2>
              <p style={{ color: '#5D6D7E', fontSize: '0.92rem' }}>Completa el formulario para registrarte en la plataforma.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Correo Electrónico</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px',
                  background: '#fff', padding: '0 12px',
                  transition: 'border-color 160ms, box-shadow 160ms',
                }}
                  onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#D4AC0D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,172,13,0.12)'; }}
                  onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#D0D0D0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#D4AC0D' }}>mail</span>
                  <input type="email" value={form.email} onChange={handleChange('email')} placeholder="correo@universidad.edu"
                    style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.92rem', color: '#2C3E50' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Nombres</label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px',
                    background: '#fff', padding: '0 12px',
                    transition: 'border-color 160ms, box-shadow 160ms',
                  }}
                    onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#D4AC0D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,172,13,0.12)'; }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#D0D0D0'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#D4AC0D' }}>person</span>
                    <input type="text" value={form.nombres} onChange={handleChange('nombres')} placeholder="Juan"
                      style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.92rem', color: '#2C3E50' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Apellidos</label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px',
                    background: '#fff', padding: '0 12px',
                    transition: 'border-color 160ms, box-shadow 160ms',
                  }}
                    onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#D4AC0D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,172,13,0.12)'; }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#D0D0D0'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#D4AC0D' }}>badge</span>
                    <input type="text" value={form.apellidos} onChange={handleChange('apellidos')} placeholder="Pérez"
                      style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.92rem', color: '#2C3E50' }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Contraseña</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px',
                  background: '#fff', padding: '0 12px',
                  transition: 'border-color 160ms, box-shadow 160ms',
                }}
                  onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#D4AC0D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,172,13,0.12)'; }}
                  onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#D0D0D0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#D4AC0D' }}>lock</span>
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange('password')} placeholder="Mínimo 8 caracteres"
                    style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.92rem', color: '#2C3E50' }}
                  />
                  <span className="material-symbols-outlined" onClick={() => setShowPassword(!showPassword)}
                    style={{ fontSize: '20px', color: '#9CA3AF', cursor: 'pointer', flexShrink: 0, userSelect: 'none' }}>
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Confirmar Contraseña</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px',
                  background: '#fff', padding: '0 12px',
                  transition: 'border-color 160ms, box-shadow 160ms',
                }}
                  onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#D4AC0D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,172,13,0.12)'; }}
                  onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#D0D0D0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#D4AC0D' }}>lock</span>
                  <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange('confirmPassword')} placeholder="Repite la contraseña"
                    style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.92rem', color: '#2C3E50' }}
                  />
                  <span className="material-symbols-outlined" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ fontSize: '20px', color: '#9CA3AF', cursor: 'pointer', flexShrink: 0, userSelect: 'none' }}>
                    {showConfirmPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', height: '52px', border: 'none', borderRadius: '8px',
                background: '#1A1A2E', color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1,
                transition: 'opacity 160ms',
              }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = '1'; }}
              >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </form>

            <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.88rem', color: '#5D6D7E' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: '#9A6F00', fontWeight: 700 }}>Iniciar Sesión</Link>
            </p>
          </div>
        </div>

        <p style={{ color: '#9CA3AF', fontSize: '0.75rem', textAlign: 'center', flexShrink: 0 }}>
          © 2026 SmartChair - Academic Conference Management System
        </p>
      </section>
    </div>
  );
}

export default Register;
