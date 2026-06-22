import { useState } from 'react';

const ROLES = [
  {
    key: 'AUTOR',
    label: 'Autor',
    badge: 'Investigador',
    icon: 'description',
    desc: 'Gestiona y envía sus ponencias, artículos o trabajos de investigación para evaluación.',
    color: '#1A1A2E',
  },
  {
    key: 'REVISOR',
    label: 'Revisor',
    badge: 'Evaluador',
    icon: 'rate_review',
    desc: 'Evalúa y revisa las ponencias asignadas, emitiendo observaciones y recomendaciones.',
    color: '#1A1A2E',
  },
  {
    key: 'ORGANIZADOR',
    label: 'Organizador',
    badge: 'Comité',
    icon: 'groups',
    desc: 'Administra conferencias, eventos, cronogramas y coordina el comité revisor.',
    color: '#1A1A2E',
  },
  {
    key: 'ADMINISTRADOR',
    label: 'Administrador',
    badge: 'Sistema',
    icon: 'admin_panel_settings',
    desc: 'Control total del sistema, usuarios, roles, configuraciones y permisos globales.',
    color: '#C0392B',
  },
];

function RoleSelector({ onSelect, backendRole }) {
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!selected) return;
    const normalizedRole = (backendRole || '').toUpperCase();
    if (normalizedRole !== 'ADMINISTRADOR' && selected !== normalizedRole) {
      setError(`No tienes permisos para acceder como "${ROLES.find((r) => r.key === selected).label}". Selecciona el rol que corresponde a tu perfil.`);
      return;
    }
    onSelect(selected);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,15,35,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '40px 40px 32px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          animation: 'roleFadeIn 0.4s ease-out',
        }}
      >
        <style>{`
          @keyframes roleFadeIn { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
          @keyframes cardPop { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        `}</style>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, #FEF9E7 0%, #F5E6C8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#9A6F00' }}>assignment_ind</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1A1A2E' }}>
            Selecciona tu Rol
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#5D6D7E', maxWidth: 440, lineHeight: 1.5, marginLeft: 'auto', marginRight: 'auto' }}>
            Indica cuál es tu función dentro de la plataforma para acceder a las herramientas y permisos correspondientes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28 }}>
          {ROLES.map((role, i) => {
            const isSelected = selected === role.key;
            return (
              <div
                key={role.key}
                onClick={() => { setSelected(role.key); setError(''); }}
                style={{
                  position: 'relative',
                  borderRadius: 16,
                  border: `2px solid ${isSelected ? '#D4AC0D' : '#E5E8EB'}`,
                  background: isSelected ? '#FEF9E7' : '#FFFFFF',
                  padding: '20px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  animation: `cardPop 0.35s ease-out ${i * 0.07}s both`,
                  boxShadow: isSelected ? '0 4px 20px rgba(212,172,13,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#D4AC0D';
                    e.currentTarget.style.background = '#FFFBEF';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,172,13,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#E5E8EB';
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#D4AC0D',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#FFF' }}>check</span>
                  </div>
                )}

                <div
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: isSelected ? '#F5E6C8' : '#F0F2F5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12, transition: 'background 0.2s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: isSelected ? '#9A6F00' : '#5D6D7E' }}>
                    {role.icon}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px', borderRadius: 6,
                      fontSize: '10px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: isSelected ? '#D4AC0D' : '#E5E8EB',
                      color: isSelected ? '#FFF' : '#5D6D7E',
                      marginBottom: 6, transition: 'all 0.2s',
                    }}
                  >
                    {role.badge}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1A1A2E' }}>
                    {role.label}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5D6D7E', lineHeight: 1.4 }}>
                    {role.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 16,
              background: 'rgba(192,57,43,0.06)',
              border: '1px solid rgba(192,57,43,0.12)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#C0392B', flexShrink: 0 }}>error_outline</span>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#C0392B', lineHeight: 1.4 }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: selected ? 'linear-gradient(135deg, #9A6F00 0%, #D4AC0D 100%)' : '#E5E8EB',
            color: selected ? '#FFF' : '#9CA3AF',
            fontSize: '15px',
            fontWeight: 700,
            cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: selected ? '0 4px 15px rgba(212,172,13,0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (selected) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,172,13,0.35)';
            }
          }}
          onMouseLeave={(e) => {
            if (selected) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(212,172,13,0.3)';
            }
          }}
        >
          {selected ? `Continuar como ${ROLES.find((r) => r.key === selected).label}` : 'Selecciona un rol para continuar'}
        </button>

        <p style={{ margin: '14px 0 0', fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
          Selecciona el rol que mejor describa tus funciones dentro de la plataforma.
        </p>
      </div>
    </div>
  );
}

export default RoleSelector;
