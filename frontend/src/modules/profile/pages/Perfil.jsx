import { useEffect, useState } from 'react';
import { auth } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';

function Perfil() {
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombres: '', apellidos: '' });
  const [passForm, setPassForm] = useState({ password_actual: '', nueva_password: '', confirmar_password: '' });

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

  if (loading) return <p style={{ color: '#5D6D7E' }}>Cargando...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
      <div>
        <p style={{ margin: '0 0 6px', color: '#5D6D7E', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Dashboard › Mi Perfil
        </p>
        <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#2C3E50' }}>Mi Perfil</h1>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: '#2C3E50' }}>Información Personal</h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Email</label>
            <input type="email" value={profile?.email || ''} disabled
              style={{ width: '100%', height: '48px', border: '1px solid #E8EAED', borderRadius: '8px', padding: '0 12px', fontSize: '0.92rem', background: '#F5F7FA', color: '#9CA3AF' }}
            />
          </div>
          <div className="perfil-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Nombres</label>
              <input type="text" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                style={{ width: '100%', height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px', padding: '0 12px', fontSize: '0.92rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Apellidos</label>
              <input type="text" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                style={{ width: '100%', height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px', padding: '0 12px', fontSize: '0.92rem', outline: 'none' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Rol</label>
            <input type="text" value={profile?.rol || '—'} disabled
              style={{ width: '100%', height: '48px', border: '1px solid #E8EAED', borderRadius: '8px', padding: '0 12px', fontSize: '0.92rem', background: '#F5F7FA', color: '#9CA3AF' }}
            />
          </div>
          <button type="submit" style={{
            alignSelf: 'flex-start', padding: '10px 24px', background: '#1A1A2E', color: '#fff',
            border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
          }}>
            Guardar Cambios
          </button>
        </form>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: '#2C3E50' }}>Cambiar Contraseña</h2>
        <form onSubmit={handlePass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Contraseña Actual</label>
            <input type="password" value={passForm.password_actual} onChange={(e) => setPassForm({ ...passForm, password_actual: e.target.value })}
              style={{ width: '100%', height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px', padding: '0 12px', fontSize: '0.92rem', outline: 'none' }}
            />
          </div>
          <div className="perfil-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Nueva Contraseña</label>
              <input type="password" value={passForm.nueva_password} onChange={(e) => setPassForm({ ...passForm, nueva_password: e.target.value })}
                style={{ width: '100%', height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px', padding: '0 12px', fontSize: '0.92rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#2C3E50', marginBottom: '6px' }}>Confirmar Nueva</label>
              <input type="password" value={passForm.confirmar_password} onChange={(e) => setPassForm({ ...passForm, confirmar_password: e.target.value })}
                style={{ width: '100%', height: '48px', border: '1px solid #D0D0D0', borderRadius: '8px', padding: '0 12px', fontSize: '0.92rem', outline: 'none' }}
              />
            </div>
          </div>
          <button type="submit" style={{
            alignSelf: 'flex-start', padding: '10px 24px', background: '#1A1A2E', color: '#fff',
            border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
          }}>
            Cambiar Contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

export default Perfil;
