import { useState, useEffect } from 'react';
import { conferencias } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';

const AREA_GROUPS = [
  {
    label: 'FARRN',
    areas: ['Agronomía', 'Agroecología', 'Zootecnia', 'Veterinaria', 'Forestal', 'Suelos', 'Riego', 'Producción Animal', 'Sanidad Vegetal'],
  },
  {
    label: 'FEIRNNR — Computación',
    areas: ['Ciencias de la Computación', 'Ingeniería en Sistemas', 'Inteligencia Artificial', 'Redes y Comunicaciones', 'Ciberseguridad', 'Desarrollo de Software', 'Bases de Datos', 'Computación en la Nube', 'Internet de las Cosas', 'Realidad Virtual y Aumentada'],
  },
  {
    label: 'FEIRNNR — Ingenierías',
    areas: ['Ingeniería Civil', 'Ingeniería Eléctrica', 'Ingeniería Electrónica', 'Ingeniería Industrial', 'Ingeniería Mecánica', 'Ingeniería Ambiental', 'Ingeniería en Geología Ambiental y Ordenamiento Territorial', 'Ingeniería en Geodesia y Topografía', 'Ingeniería Química', 'Ingeniería Agroindustrial', 'Ingeniería en Alimentos', 'Ingeniería en Biotecnología', 'Materiales y Metalurgia'],
  },
  {
    label: 'FEAC',
    areas: ['Contabilidad y Auditoría', 'Administración de Empresas', 'Economía', 'Marketing', 'Finanzas', 'Gestión de Proyectos', 'Emprendimiento'],
  },
  {
    label: 'FJSA',
    areas: ['Derecho', 'Ciencias Políticas', 'Relaciones Internacionales', 'Criminología', 'Derecho Penal', 'Derecho Civil', 'Derecho Constitucional', 'Derecho Empresarial'],
  },
  {
    label: 'FSH',
    areas: ['Psicología', 'Trabajo Social', 'Sociología', 'Antropología', 'Comunicación Social', 'Educación Inicial', 'Educación Básica', 'Psicopedagogía', 'Educación Especial', 'Lengua y Literatura', 'Idioma Inglés'],
  },
  {
    label: 'Deportes',
    areas: ['Cultura Física', 'Entrenamiento Deportivo', 'Recreación', 'Gestión Deportiva', 'Fisioterapia'],
  },
  {
    label: 'UED',
    areas: ['Pedagogía de la Actividad Física', 'Entrenamiento Deportivo Alto Rendimiento', 'Recreación y Tiempo Libre'],
  },
];

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #E5E8EB',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  color: '#2C3E50',
  background: '#FFF',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '13px',
  color: '#555',
  marginBottom: '4px',
  fontWeight: 500,
  display: 'block',
};

function CreateConferenceModal({ isOpen, onClose, conference, onSaved }) {
  const { addToast } = useToast();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [esPago, setEsPago] = useState(false);
  const [montoInscripcion, setMontoInscripcion] = useState('');
  const [visibilidad, setVisibilidad] = useState('publica');
  const [esPlantilla, setEsPlantilla] = useState(false);
  const [fechaCierrePostulaciones, setFechaCierrePostulaciones] = useState('');
  const [areasSeleccionadas, setAreasSeleccionadas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTitulo('');
      setDescripcion('');
      setFechaInicio('');
      setFechaFin('');
      setEsPago(false);
      setMontoInscripcion('');
      setVisibilidad('publica');
      setEsPlantilla(false);
      setFechaCierrePostulaciones('');
      setAreasSeleccionadas([]);
      setError('');
      setExito(false);
      setGuardando(false);
      return;
    }
    if (conference) {
      setTitulo(conference.nombre || conference.titulo || '');
      setDescripcion(conference.descripcion || '');
      setFechaInicio(conference.fecha_inicio ? conference.fecha_inicio.slice(0, 10) : '');
      setFechaFin(conference.fecha_fin ? conference.fecha_fin.slice(0, 10) : '');
      setEsPago(!!(conference.es_de_pago || conference.es_pago));
      setMontoInscripcion(conference.monto_inscripcion || '');
      setVisibilidad(conference.visibilidad || 'publica');
      setEsPlantilla(!!(conference.es_plantilla));
      setFechaCierrePostulaciones(conference.fecha_cierre_postulaciones ? conference.fecha_cierre_postulaciones.slice(0, 10) : '');
      setAreasSeleccionadas(conference.areas_tematicas || []);
    }
  }, [isOpen, conference]);

  const toggleArea = (area) => {
    setAreasSeleccionadas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!titulo.trim()) { setError('El título es obligatorio.'); return; }
    if (!descripcion.trim()) { setError('La descripción es obligatoria.'); return; }
    if (!fechaInicio) { setError('La fecha de inicio es obligatoria.'); return; }
    if (!fechaFin) { setError('La fecha de fin es obligatoria.'); return; }

    const payload = {
      nombre: titulo.trim(),
      descripcion: descripcion.trim(),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      es_de_pago: esPago,
      visibilidad,
      es_plantilla: esPlantilla,
      areas_tematicas: areasSeleccionadas,
    };

    if (esPago && montoInscripcion) {
      payload.monto_inscripcion = parseFloat(montoInscripcion);
    }

    if (fechaCierrePostulaciones) {
      payload.fecha_cierre_postulaciones = fechaCierrePostulaciones;
    }

    setGuardando(true);
    try {
      if (conference && conference.slug) {
        await conferencias.editar(conference.slug, payload);
      } else {
        await conferencias.crear(payload);
      }
      setExito(true);
      addToast(conference ? 'Conferencia actualizada' : 'Conferencia creada correctamente', 'success');
      if (onSaved) onSaved();
      setTimeout(() => {
        setExito(false);
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !guardando) onClose(); }}
    >
      <div
        style={{
          background: '#FFF',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1A1A2E' }}>
            {conference ? 'Editar Conferencia' : 'Crear Conferencia'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '22px',
              color: '#9CA3AF',
              padding: '4px 8px',
              borderRadius: '6px',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#1A1A2E'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
          >
            ✕
          </button>
        </div>

        {exito ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '48px', color: '#1E8449', marginBottom: '12px' }}>✓</div>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
              {conference ? 'Conferencia actualizada' : 'Conferencia creada'} exitosamente
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Título <span style={{ color: '#C0392B' }}>*</span></label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título de la conferencia"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Descripción <span style={{ color: '#C0392B' }}>*</span></label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción de la conferencia"
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Fecha de Inicio <span style={{ color: '#C0392B' }}>*</span></label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Fecha de Fin <span style={{ color: '#C0392B' }}>*</span></label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: esPago ? '12px' : 0 }}>
                <input
                  type="checkbox"
                  id="es-pago"
                  checked={esPago}
                  onChange={(e) => setEsPago(e.target.checked)}
                  style={{ accentColor: '#D4AC0D' }}
                />
                <label htmlFor="es-pago" style={{ display: 'inline', marginLeft: '8px', fontSize: '13px', color: '#555', fontWeight: 500 }}>
                  ¿Es de pago?
                </label>
              </div>
              {esPago && (
                <div style={{ marginTop: '12px' }}>
                  <label style={labelStyle}>Monto de inscripción</label>
                  <input
                    type="number"
                    value={montoInscripcion}
                    onChange={(e) => setMontoInscripcion(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{ ...inputStyle, maxWidth: '250px' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Visibilidad</label>
                <select
                  value={visibilidad}
                  onChange={(e) => setVisibilidad(e.target.value)}
                  style={inputStyle}
                >
                  <option value="publica">Pública</option>
                  <option value="privada">Privada</option>
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="es-plantilla"
                    checked={esPlantilla}
                    onChange={(e) => setEsPlantilla(e.target.checked)}
                    style={{ accentColor: '#D4AC0D' }}
                  />
                  <label htmlFor="es-plantilla" style={{ display: 'inline', marginLeft: '8px', fontSize: '13px', color: '#555', fontWeight: 500 }}>
                    ¿Guardar como plantilla?
                  </label>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Fecha límite de postulación</label>
              <input
                type="date"
                value={fechaCierrePostulaciones}
                onChange={(e) => setFechaCierrePostulaciones(e.target.value)}
                style={{ ...inputStyle, maxWidth: '300px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...labelStyle, marginBottom: '8px' }}>Áreas temáticas permitidas</label>
              <div
                style={{
                  border: '1px solid #E5E8EB',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                {AREA_GROUPS.map((group) => (
                  <div key={group.label} style={{ marginBottom: '14px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1A1A2E', fontSize: '13px', marginBottom: '6px' }}>
                      {group.label}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {group.areas.map((area) => {
                        const selected = areasSeleccionadas.includes(area);
                        return (
                          <label
                            key={area}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              background: selected ? '#FEF9E7' : '#F5F7FA',
                              border: selected ? '1px solid #D4AC0D' : '1px solid #E5E8EB',
                              color: selected ? '#9A6F00' : '#2C3E50',
                              fontWeight: selected ? 600 : 400,
                              transition: 'all 0.15s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleArea(area)}
                              style={{ accentColor: '#D4AC0D' }}
                            />
                            {area}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ color: '#C0392B', fontSize: '13px', padding: '8px 12px', background: '#FDE8E8', borderRadius: '6px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E5E8EB', paddingTop: '20px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid #E5E8EB',
                  background: '#FFF',
                  color: '#555',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: guardando ? 0.5 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                style={{
                  padding: '10px 28px',
                  borderRadius: '8px',
                  border: 'none',
                  background: guardando ? '#B8892E' : '#D4AC0D',
                  color: '#FFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: guardando ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: guardando ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {guardando && (
                  <span style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFF',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                )}
                {guardando ? 'Guardando...' : (conference ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateConferenceModal;
