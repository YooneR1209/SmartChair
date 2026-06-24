import { useEffect, useState } from 'react';
import { auth } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';

function Perfil() {
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombres: '', apellidos: '' });
  const [passForm, setPassForm] = useState({ password_actual: '', nueva_password: '', confirmar_password: '' });
  const [showPass, setShowPass] = useState({ actual: false, nueva: false, confirmar: false });

  useEffect(() => {
    auth.perfil()
      .then((data) => {
        setProfile(data);
        setForm({ nombres: data.nombres || '', apellidos: data.apellidos || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await auth.actualizarPerfil(form);
      addToast('Perfil actualizado correctamente.', 'success');
      const updated = await auth.perfil();
      setProfile(updated);
      localStorage.setItem('profile', JSON.stringify(updated));
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
    }
  };

  const handlePass = async (e) => {
    e.preventDefault();
    if (passForm.nueva_password !== passForm.confirmar_password) {
      addToast('Las contraseñas no coinciden.', 'error');
      return;
    }
    if (passForm.nueva_password.length < 8) {
      addToast('La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }
    try {
      await auth.cambiarPassword({
        password_actual: passForm.password_actual,
        nueva_password: passForm.nueva_password,
      });
      addToast('Contraseña actualizada correctamente.', 'success');
      setPassForm({ password_actual: '', nueva_password: '', confirmar_password: '' });
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
    }
  };

  const initials = profile
    ? `${(profile.nombres || '')[0] || ''}${(profile.apellidos || '')[0] || ''}`.toUpperCase() || '?'
    : '?';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: '14px', gap: '10px' }}>
      <div style={{ width: 20, height: 20, border: '2px solid #E5E8EB', borderTopColor: '#D4AC0D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Cargando perfil...
    </div>
  );

  const inputStyle = {
    width: '100%', height: '44px', border: '1px solid #D0D0D0', borderRadius: '10px',
    padding: '0 12px', fontSize: '0.9rem', outline: 'none', background: '#fff',
    transition: 'border-color 160ms, box-shadow 160ms',
  };

  const inputFocus = (e) => { e.target.style.borderColor = '#D4AC0D'; e.target.style.boxShadow = '0 0 0 3px rgba(212,172,13,0.12)'; };
  const inputBlur = (e) => { e.target.style.borderColor = '#D0D0D0'; e.target.style.boxShadow = 'none'; };

  const inputDisabled = { ...inputStyle, background: '#F5F7FA', color: '#9CA3AF', border: '1px solid #E8EAED' };

  const passWrapper = {
    display: 'flex', alignItems: 'center', gap: '10px', height: '44px',
    border: '1px solid #D0D0D0', borderRadius: '10px', background: '#fff', padding: '0 12px',
    transition: 'border-color 160ms, box-shadow 160ms',
  };

  const btnBase = {
    padding: '11px 28px', border: 'none', borderRadius: '10px', fontWeight: 700,
    fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s',
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #2C3E50 100%)',
        borderRadius: '20px', padding: '36px 32px', marginBottom: '28px',
        display: 'flex', alignItems: 'center', gap: '24px',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #D4AC0D, #F5E6C8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: '28px', fontWeight: 800, color: '#1A1A2E',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            {profile?.nombres || ''} {profile?.apellidos || ''}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>
            {profile?.email || ''}
          </p>
          {profile?.rol && (
            <span style={{
              display: 'inline-block', marginTop: '8px', padding: '3px 12px', borderRadius: '999px',
              fontSize: '0.72rem', fontWeight: 700, background: 'rgba(212,172,13,0.2)', color: '#D4AC0D',
            }}>
              {profile.rol.charAt(0).toUpperCase() + profile.rol.slice(1)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(212,172,13,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#D4AC0D' }}>person</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#2C3E50' }}>Información Personal</h2>
          </div>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5D6D7E', marginBottom: '5px' }}>Correo Electrónico</label>
              <input type="email" value={profile?.email || ''} disabled style={inputDisabled} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5D6D7E', marginBottom: '5px' }}>Nombres</label>
                <input type="text" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5D6D7E', marginBottom: '5px' }}>Apellidos</label>
                <input type="text" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5D6D7E', marginBottom: '5px' }}>Rol</label>
              <input type="text" value={profile?.rol || '—'} disabled style={inputDisabled} />
            </div>
            <button type="submit" style={{ ...btnBase, background: '#1A1A2E', color: '#fff', alignSelf: 'flex-start' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Guardar Cambios
            </button>
          </form>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(212,172,13,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#D4AC0D' }}>lock</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#2C3E50' }}>Cambiar Contraseña</h2>
          </div>
          <form onSubmit={handlePass} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5D6D7E', marginBottom: '5px' }}>Contraseña Actual</label>
              <div style={passWrapper}
                onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#D4AC0D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,172,13,0.12)'; }}
                onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#D0D0D0'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <input type={showPass.actual ? 'text' : 'password'} value={passForm.password_actual}
                  onChange={(e) => setPassForm({ ...passForm, password_actual: e.target.value })}
                  placeholder="••••••••"
                  style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#2C3E50' }}
                />
                <span className="material-symbols-outlined" onClick={() => setShowPass({ ...showPass, actual: !showPass.actual })}
                  style={{ fontSize: '18px', color: '#9CA3AF', cursor: 'pointer', flexShrink: 0, userSelect: 'none' }}>
                  {showPass.actual ? 'visibility' : 'visibility_off'}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5D6D7E', marginBottom: '5px' }}>Nueva Contraseña</label>
                <div style={passWrapper}
                  onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#D4AC0D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,172,13,0.12)'; }}
                  onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#D0D0D0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <input type={showPass.nueva ? 'text' : 'password'} value={passForm.nueva_password}
                    onChange={(e) => setPassForm({ ...passForm, nueva_password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#2C3E50' }}
                  />
                  <span className="material-symbols-outlined" onClick={() => setShowPass({ ...showPass, nueva: !showPass.nueva })}
                    style={{ fontSize: '18px', color: '#9CA3AF', cursor: 'pointer', flexShrink: 0, userSelect: 'none' }}>
                    {showPass.nueva ? 'visibility' : 'visibility_off'}
                  </span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5D6D7E', marginBottom: '5px' }}>Confirmar Nueva</label>
                <div style={passWrapper}
                  onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#D4AC0D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,172,13,0.12)'; }}
                  onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#D0D0D0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <input type={showPass.confirmar ? 'text' : 'password'} value={passForm.confirmar_password}
                    onChange={(e) => setPassForm({ ...passForm, confirmar_password: e.target.value })}
                    placeholder="Repite la contraseña"
                    style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#2C3E50' }}
                  />
                  <span className="material-symbols-outlined" onClick={() => setShowPass({ ...showPass, confirmar: !showPass.confirmar })}
                    style={{ fontSize: '18px', color: '#9CA3AF', cursor: 'pointer', flexShrink: 0, userSelect: 'none' }}>
                    {showPass.confirmar ? 'visibility' : 'visibility_off'}
                  </span>
                </div>
              </div>
            </div>
            <button type="submit" style={{ ...btnBase, background: '#1A1A2E', color: '#fff', alignSelf: 'flex-start' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Cambiar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
