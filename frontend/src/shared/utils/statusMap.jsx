export const STATUS_MAP = {
  enviado: { border: '#5D6D7E', badge: { bg: '#F2F4F4', text: '#5D6D7E', label: 'Enviado', dot: '#5D6D7E' }, steps: [true, false, false] },
  en_revision: { border: '#D4AC0D', badge: { bg: '#FEF9E7', text: '#D4AC0D', label: 'En Revisión', dot: '#D4AC0D' }, steps: [true, true, false] },
  aceptada: { border: '#1E8449', badge: { bg: '#E8F5E9', text: '#1E8449', label: 'Aceptada', dot: '#1E8449' }, steps: [true, true, true] },
  rechazada: { border: '#C0392B', badge: { bg: '#FDEDEC', text: '#C0392B', label: 'Rechazada', dot: '#C0392B' }, steps: [true, true, true] },
  cambios: { border: '#D4AC0D', badge: { bg: '#FEF9E7', text: '#D4AC0D', label: 'Cambios Req.', dot: '#D4AC0D' }, steps: [true, true, true] },
  aceptada_con_cambios: { border: '#D4AC0D', badge: { bg: '#FEF9E7', text: '#D4AC0D', label: 'Cambios Req.', dot: '#D4AC0D' }, steps: [true, true, true] },
  cambios_enviados: { border: '#3498DB', badge: { bg: '#EBF5FB', text: '#2980B9', label: 'Cambios Enviados', dot: '#2980B9' }, steps: [true, true, true] },
};

export function normalizeStatus(raw) {
  if (!raw) return 'enviado';
  const s = raw.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, (c) => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' })[c] || c);
  if (s === 'cambios_enviados') return 'cambios_enviados';
  if (s === 'aceptada_con_cambios') return 'aceptada_con_cambios';
  if (s.includes('revision') || s === 'en_revisión' || s === 'revisión') return 'en_revision';
  if (s.includes('acept') || s.includes('aprob')) {
    if (s.includes('cambio')) return 'aceptada_con_cambios';
    return 'aceptada';
  }
  if (s.includes('rech') || s === 'rechazado') return 'rechazada';
  if (s.includes('cambio')) return 'aceptada_con_cambios';
  if (s.includes('enviado')) return 'enviado';
  return 'enviado';
}

export function Stepper({ steps, marginTop = '12px' }) {
  const labels = ['ENVIADO', 'EN REVISIÓN', 'VEREDICTO'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop }}>
      {labels.map((label, i) => {
        const done = steps[i];
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: done ? '#1E8449' : '#E5E8EB',
                }}
              >
                {done ? (
                  <span className="material-symbols-outlined" style={{ fontSize: '11px', color: '#FFFFFF' }}>check</span>
                ) : (
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#9CA3AF' }}>{i + 1}</span>
                )}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.02em', color: done ? '#1E8449' : '#9CA3AF' }}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                style={{
                  width: '32px',
                  height: '2px',
                  margin: '0 6px',
                  borderRadius: 'full',
                  background: steps[i + 1] ? '#1E8449' : '#E5E8EB',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
