import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '../../../shared/components/ToastContext';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripeKeyValid = STRIPE_KEY && STRIPE_KEY !== 'pk_test_placeholder' && STRIPE_KEY.startsWith('pk_');
const stripePromise = stripeKeyValid ? loadStripe(STRIPE_KEY) : null;

const AREA_GROUPS = [
  {
    label: 'FARRN — Ciencias Agropecuarias y Recursos Naturales',
    options: ['Agronomía Sostenible', 'Sanidad Vegetal y Protección de Cultivos', 'Producción Pecuaria y Veterinaria', 'Biotecnología Agropecuaria', 'Manejo de Recursos Naturales', 'Suelos y Cambio Climático'],
  },
  {
    label: 'FEIRNNR — Computación',
    options: ['Inteligencia Artificial', 'Redes y Comunicaciones', 'Ciberseguridad', 'Ingeniería de Software', 'Ciencia de Datos y Big Data', 'Sistemas Distribuidos', 'Visión por Computadora', 'Procesamiento del Lenguaje Natural', 'Arquitectura de Computadoras'],
  },
  {
    label: 'FEIRNNR — Ingenierías',
    options: ['Automatización y Control Industrial', 'Electrónica y Sistemas Embebidos', 'Telecomunicaciones', 'Ingeniería Industrial y Logística', 'Energías Renovables', 'Geología y Geotecnia', 'Explotación Minera y Metalurgia'],
  },
  {
    label: 'FEAC — Educación, Arte y Comunicación',
    options: ['Pedagogía y Didáctica', 'Tecnología Educativa', 'Psicología Educativa', 'Currículum y Evaluación Educativa', 'Educación Inclusiva', 'Formación Docente', 'Comunicación y Periodismo', 'Artes y Diseño', 'Lingüística y Literatura'],
  },
  {
    label: 'FJSA — Ciencias Jurídicas, Sociales y Administrativas',
    options: ['Derecho y Ciencias Jurídicas', 'Administración de Empresas', 'Contabilidad y Auditoría', 'Economía y Finanzas', 'Marketing y Gestión Comercial', 'Trabajo Social', 'Sociología y Políticas Públicas', 'Turismo y Hotelería'],
  },
  {
    label: 'FSH — Ciencias de la Salud',
    options: ['Medicina Humana', 'Enfermería', 'Psicología Clínica', 'Salud Pública y Epidemiología', 'Nutrición y Dietética', 'Farmacia y Bioquímica', 'Odontología'],
  },
  {
    label: 'Ciencias del Deporte y Actividad Física',
    options: ['Entrenamiento Deportivo', 'Educación Física', 'Biomecánica Deportiva', 'Psicología del Deporte', 'Gestión Deportiva', 'Nutrición Deportiva', 'Rehabilitación Física'],
  },
  {
    label: 'Unidad de Estudios a Distancia y en Línea',
    options: ['Diseño Instruccional', 'Entornos Virtuales de Aprendizaje', 'Recursos Educativos Abiertos', 'Gestión de la Educación en Línea'],
  },
];

const inputClass = "w-full h-11 rounded-xl px-3.5 text-sm outline-none border transition-all duration-200";
const inputStyle = (focused) => ({
  borderColor: focused ? '#D4AC0D' : '#E5E8EB',
  color: '#2C3E50',
  background: '#FFF',
  boxShadow: focused ? '0 0 0 3px rgba(212, 172, 13, 0.1)' : 'none',
});
const labelStyle = { color: '#1A1A2E', fontSize: '13px', fontWeight: 700, marginBottom: '6px', display: 'block' };

function PostularModal({ isOpen, onClose, onSuccess }) {
  const { addToast } = useToast();
  const getToken = useCallback(() => localStorage.getItem('token'), []);
  const [titulo, setTitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [areaTematica, setAreaTematica] = useState('');
  const [coautores, setCoautores] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ponenciaId, setPonenciaId] = useState(null);
  const [showPago, setShowPago] = useState(false);
  const [pagoLoading, setPagoLoading] = useState(false);
  const [pagoError, setPagoError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [exito, setExito] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const areaRef = useRef(null);

  useEffect(() => {
    if (!areaOpen) return;
    const handler = (e) => {
      if (areaRef.current && !areaRef.current.contains(e.target)) setAreaOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [areaOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTitulo('');
      setResumen('');
      setAreaTematica('');
      setCoautores([]);
      setArchivo(null);
      setError('');
      setFieldErrors([]);
      setExito(false);
    }
  }, [isOpen]);

  const agregarCoautor = () => {
    if (coautores.length < 5) {
      setCoautores([...coautores, { nombre: '', email: '', institucion: '' }]);
    }
  };

  const eliminarCoautor = (i) => {
    setCoautores(coautores.filter((_, idx) => idx !== i));
  };

  const actualizarCoautor = (i, campo, valor) => {
    const nuevos = [...coautores];
    nuevos[i] = { ...nuevos[i], [campo]: valor };
    setCoautores(nuevos);
  };

  const validar = () => {
    if (!titulo.trim()) return 'El título es obligatorio.';
    if (!resumen.trim()) return 'El resumen es obligatorio.';
    const palabras = resumen.trim().split(/\s+/);
    if (palabras.length > 300) return `El resumen excede las 300 palabras (tiene ${palabras.length}).`;
    if (!areaTematica) return 'Selecciona un área temática.';
    if (!archivo) return 'El archivo PDF es obligatorio.';
    if (archivo.type !== 'application/pdf') return 'El archivo debe ser PDF.';
    return '';
  };

  const enviar = async (e) => {
    e.preventDefault();
    const err = validar();
    if (err) { setError(err); return; }
    setEnviando(true);
    setError('');
    setFieldErrors([]);
    try {
      const formData = new FormData();
      formData.append('titulo', titulo.trim());
      formData.append('resumen', resumen.trim());
      formData.append('area_tematica', areaTematica);
      formData.append('archivo', archivo);
      if (coautores.length > 0) {
        formData.append('autores', JSON.stringify(coautores.filter((c) => c.nombre.trim())));
      }
      const res = await fetch(`${API_URL}/conferencias/ponencias/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msgs = [];
        const fe = [];
        if (body.detail) msgs.push(body.detail);
        if (body.message) msgs.push(body.message);
        if (body.non_field_errors) msgs.push(...body.non_field_errors);
        if (body.error) msgs.push(body.error);
        for (const k of Object.keys(body)) {
          if (!['detail','message','non_field_errors','error'].includes(k) && Array.isArray(body[k])) {
            msgs.push(`${k}: ${body[k].join(', ')}`);
            fe.push({ field: k, messages: body[k] });
          }
        }
        setFieldErrors(fe);
        throw new Error(msgs.length > 0 ? msgs.join(' | ') : `Error ${res.status} al enviar la ponencia.`);
      }
      setPonenciaId(body.id);
      setExito(true);
      addToast('Ponencia enviada correctamente', 'success');
    } catch (err) {
      setError(err.message);
      addToast(err.message || 'Error al enviar ponencia', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const handleIniciarPago = async () => {
    setPagoLoading(true);
    setPagoError('');
    try {
      const res = await fetch(`${API_URL}/payments/crear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ monto: 20, moneda: 'usd', referencia_tipo: 'Ponencia', referencia_id: ponenciaId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.message || 'Error al crear el pago.');
      setClientSecret(data.client_secret);
      setShowPago(true);
    } catch (err) {
      setPagoError(err.message);
    } finally {
      setPagoLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
      style={{ backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) onClose(); }}
    >
      <div
        className="bg-white w-full max-w-[640px] relative max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{
          borderRadius: '20px',
          animation: 'modalFadeIn 0.25s ease-out',
        }}
      >
        <style>{`
          @keyframes modalFadeIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        `}</style>

        <button
          onClick={onClose}
          disabled={enviando}
          className="absolute top-5 right-5 bg-transparent border-none cursor-pointer z-10 flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 8, color: '#9CA3AF' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#1A1A2E'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
        </button>

        {exito ? (
          <div className="text-center" style={{ padding: '40px 24px' }}>
            <div
              style={{
                width: 72, height: 72, borderRadius: '50%', background: '#E8F5E9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#1E8449' }}>check_circle</span>
            </div>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A2E', marginTop: 20, marginBottom: 4 }}>
              ¡Ponencia enviada!
            </p>
            <p style={{ fontSize: '14px', color: '#5D6D7E', margin: '4px 0 0' }}>
              Tu trabajo ha sido recibido correctamente.
            </p>

            {!showPago ? (
              <div style={{ marginTop: '24px', padding: '20px', background: '#FFF8E1', borderRadius: '12px', border: '1px solid #F5E6C8' }}>
                <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#9A6F00' }}>
                  Pago requerido — $20.00 USD
                </p>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#5D6D7E' }}>
                  Debes pagar para completar tu postulación. Tu ponencia será revisada después del pago.
                </p>
                {pagoError && (
                  <p style={{ margin: '0 0 12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(192,57,43,0.08)', color: '#C0392B', fontSize: '12px', fontWeight: 600 }}>
                    {pagoError}
                  </p>
                )}
                <button onClick={handleIniciarPago} disabled={pagoLoading}
                  style={{
                    width: '100%', height: '48px', border: 'none', borderRadius: '10px',
                    background: pagoLoading ? '#B8892E' : '#D4AC0D', color: '#1A1A2E',
                    fontSize: '15px', fontWeight: 700, cursor: pagoLoading ? 'wait' : 'pointer',
                    opacity: pagoLoading ? 0.6 : 1,
                  }}>
                  {pagoLoading ? 'Preparando pago...' : 'Pagar $20 USD'}
                </button>
                <button onClick={() => { if (onSuccess) onSuccess(); if (onClose) onClose(); }}
                  style={{
                    marginTop: '8px', width: '100%', height: '40px', border: '1px solid #E5E8EB',
                    borderRadius: '10px', background: '#FFF', color: '#5D6D7E',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}>
                  Pagar después
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '24px' }}>
                {stripePromise && clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PagoPostularForm
                      clientSecret={clientSecret}
                      onSuccess={() => { if (onSuccess) onSuccess(); if (onClose) onClose(); }}
                      onError={(msg) => setPagoError(msg)}
                    />
                  </Elements>
                ) : (
                  <p style={{ color: '#C0392B', fontSize: '13px', fontWeight: 600 }}>
                    Stripe no está configurado. Verifica VITE_STRIPE_PUBLIC_KEY.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={enviar} style={{ padding: '32px 32px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12, background: '#FEF9E7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#9A6F00' }}>description</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1A1A2E' }}>
                  Nueva Ponencia
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#5D6D7E' }}>
                  Completá los datos para enviar tu trabajo
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label style={labelStyle}>
                Título del trabajo <span style={{ color: '#C0392B' }}>*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Modelo de aprendizaje profundo para..."
                className={inputClass}
                style={inputStyle(focusedField === 'titulo')}
                onFocus={() => setFocusedField('titulo')}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            <div className="mb-5">
              <label style={labelStyle}>
                Resumen <span style={{ color: '#C0392B' }}>*</span>
                <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: 6, fontSize: '12px' }}>(máx. 300 palabras)</span>
              </label>
              <textarea
                value={resumen}
                onChange={(e) => setResumen(e.target.value)}
                placeholder="Resumen del trabajo"
                rows={4}
                className={`${inputClass} resize-y`}
                style={{ ...inputStyle(focusedField === 'resumen'), height: 'auto', paddingTop: 10, fontFamily: 'inherit' }}
                onFocus={() => setFocusedField('resumen')}
                onBlur={() => setFocusedField(null)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <span
                  style={{
                    fontSize: '11px', fontWeight: 600,
                    color: (resumen.trim() ? resumen.trim().split(/\s+/).length : 0) > 280
                      ? (resumen.trim().split(/\s+/).length > 300 ? '#C0392B' : '#D4AC0D')
                      : '#9CA3AF',
                  }}
                >
                  {resumen.trim() ? resumen.trim().split(/\s+/).length : 0}/300 palabras
                </span>
              </div>
            </div>

            <div className="mb-5">
              <label style={labelStyle}>
                Área Temática <span style={{ color: '#C0392B' }}>*</span>
              </label>
              <div ref={areaRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setAreaOpen(!areaOpen)}
                  onFocus={() => setFocusedField('area')}
                  onBlur={() => setFocusedField(null)}
                  tabIndex={0}
                  style={{
                    ...inputStyle(focusedField === 'area' || areaOpen),
                    ...{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', height: 44, borderRadius: 12, padding: '0 14px', fontSize: '13px' },
                  }}
                >
                  <span style={{ color: areaTematica ? '#2C3E50' : '#9CA3AF' }}>
                    {areaTematica || 'Seleccionar área temática'}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9CA3AF', transition: 'transform 0.2s', transform: areaOpen ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </div>
                {areaOpen && (
                  <div
                    style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: '#FFF', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      zIndex: 100, maxHeight: 280, overflowY: 'auto', border: '1px solid #E5E8EB',
                    }}
                  >
                    {AREA_GROUPS.map((group) => (
                      <div key={group.label}>
                        <div
                          style={{
                            padding: '8px 14px 4px', fontSize: '11px', fontWeight: 700,
                            color: '#9A6F00', letterSpacing: '0.3px', textTransform: 'uppercase',
                          }}
                        >
                          {group.label}
                        </div>
                        {group.options.map((opt) => (
                          <div
                            key={opt}
                            onClick={() => { setAreaTematica(opt); setAreaOpen(false); }}
                            style={{
                              padding: '9px 14px', fontSize: '13px', cursor: 'pointer',
                              color: areaTematica === opt ? '#9A6F00' : '#2C3E50',
                              background: areaTematica === opt ? '#FEF9E7' : 'transparent',
                              fontWeight: areaTematica === opt ? 700 : 400,
                              borderLeft: areaTematica === opt ? '3px solid #D4AC0D' : '3px solid transparent',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { if (areaTematica !== opt) { e.currentTarget.style.background = '#F5F7FA'; } }}
                            onMouseLeave={(e) => { if (areaTematica !== opt) { e.currentTarget.style.background = 'transparent'; } }}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>



            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Coautores
                  <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: 6, fontSize: '12px' }}>(opcional, máx. 5)</span>
                </label>
                {coautores.length < 5 && (
                  <button
                    type="button"
                    onClick={agregarCoautor}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 14px', borderRadius: 8,
                      border: `1px dashed ${coautores.length === 0 ? '#D4AC0D' : '#D0D0D0'}`,
                      background: coautores.length === 0 ? '#FEF9E7' : 'transparent',
                      color: coautores.length === 0 ? '#9A6F00' : '#5D6D7E',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF9E7'; e.currentTarget.style.borderColor = '#D4AC0D'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = coautores.length === 0 ? '#FEF9E7' : 'transparent'; e.currentTarget.style.borderColor = coautores.length === 0 ? '#D4AC0D' : '#D0D0D0'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    Agregar
                  </button>
                )}
              </div>
              {coautores.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    padding: '10px 12px', marginBottom: 8,
                    borderRadius: 12, background: '#F5F7FA',
                    border: '1px solid #E5E8EB',
                  }}
                >
                  <div style={{ flex: 2, minWidth: 0 }}>
                    <input
                      type="text"
                      value={c.nombre}
                      onChange={(e) => actualizarCoautor(i, 'nombre', e.target.value)}
                      placeholder="Nombre"
                      className="w-full h-10 rounded-lg px-3 text-sm outline-none border"
                      style={{ borderColor: '#E5E8EB', color: '#2C3E50' }}
                    />
                  </div>
                  <div style={{ flex: 2, minWidth: 0 }}>
                    <input
                      type="email"
                      value={c.email}
                      onChange={(e) => actualizarCoautor(i, 'email', e.target.value)}
                      placeholder="Email"
                      className="w-full h-10 rounded-lg px-3 text-sm outline-none border"
                      style={{ borderColor: '#E5E8EB', color: '#2C3E50' }}
                    />
                  </div>
                  <div style={{ flex: 2, minWidth: 0 }}>
                    <input
                      type="text"
                      value={c.institucion}
                      onChange={(e) => actualizarCoautor(i, 'institucion', e.target.value)}
                      placeholder="Institución"
                      className="w-full h-10 rounded-lg px-3 text-sm outline-none border"
                      style={{ borderColor: '#E5E8EB', color: '#2C3E50' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarCoautor(i)}
                    style={{
                      background: 'rgba(192,57,43,0.08)', border: 'none',
                      borderRadius: 8, width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#C0392B', flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.08)'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label style={labelStyle}>
                Archivo PDF <span style={{ color: '#C0392B' }}>*</span>
              </label>
              <div
                className="cursor-pointer"
                style={{
                  border: `2px dashed ${archivo ? '#D4AC0D' : '#E5E8EB'}`,
                  borderRadius: 14,
                  padding: '20px 16px',
                  textAlign: 'center',
                  background: archivo ? '#FEF9E7' : '#FAFAFA',
                  transition: 'all 0.2s',
                }}
                onClick={() => document.getElementById('pdf-input-postular').click()}
                onMouseEnter={(e) => { if (!archivo) { e.currentTarget.style.borderColor = '#D4AC0D'; e.currentTarget.style.background = '#FEF9E7'; } }}
                onMouseLeave={(e) => { if (!archivo) { e.currentTarget.style.borderColor = '#E5E8EB'; e.currentTarget.style.background = '#FAFAFA'; } }}
              >
                {archivo ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#9A6F00' }}>picture_as_pdf</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1A1A2E' }}>{archivo.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF' }}>
                    {(archivo.size / 1024).toFixed(1)} KB — hacé click para cambiar
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#9CA3AF', display: 'block', marginBottom: 8 }}>upload_file</span>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#5D6D7E' }}>
                      Hacé click para subir el PDF
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9CA3AF' }}>
                      Solo archivos PDF
                    </p>
                  </div>
                )}
                <input
                  id="pdf-input-postular"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setArchivo(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(192,57,43,0.06)',
                  border: '1px solid rgba(192,57,43,0.12)',
                  marginBottom: 20,
                }}
              >
                {error.split(' | ').map((errMsg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < error.split(' | ').length - 1 ? 6 : 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#C0392B', flexShrink: 0, marginTop: 1 }}>error_outline</span>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#C0392B' }}>{errMsg}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #E5E8EB', paddingTop: 20 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={enviando}
                style={{
                  padding: '11px 24px', borderRadius: 10,
                  border: '1px solid #E5E8EB', background: '#FFF',
                  color: '#2C3E50', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s',
                  opacity: enviando ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!enviando) e.currentTarget.style.background = '#F5F7FA'; }}
                onMouseLeave={(e) => { if (!enviando) e.currentTarget.style.background = '#FFF'; }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                style={{
                  padding: '11px 28px', borderRadius: 10,
                  border: 'none', background: enviando ? '#B8892E' : '#9A6F00',
                  color: '#FFF', fontSize: '13px', fontWeight: 700,
                  cursor: enviando ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s',
                  opacity: enviando ? 0.7 : 1,
                }}
              >
                {enviando && (
                  <div style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                )}
                {enviando ? 'Enviando...' : 'Enviar Ponencia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PagoPostularForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    try {
      const card = elements.getElement(CardNumberElement);
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });
      if (confirmError) {
        setError(confirmError.message);
        if (onError) onError(confirmError.message);
      } else if (paymentIntent.status === 'succeeded') {
        try {
          await fetch(`${API_URL}/payments/confirmar/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ payment_intent_id: paymentIntent.id, charge_id: paymentIntent.latest_charge || '' }),
          });
        } catch { /* webhook fallback */ }
        if (onSuccess) onSuccess();
      } else {
        setError(`Estado: ${paymentIntent.status}`);
      }
    } catch (err) {
      setError(err.message);
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputWrapper = { padding: '12px 14px', border: '1px solid #D0D0D0', borderRadius: '8px', background: '#fff' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#2C3E50', marginBottom: '4px' };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Número de Tarjeta</label>
        <div style={inputWrapper}><CardNumberElement /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Vencimiento</label>
          <div style={inputWrapper}><CardExpiryElement /></div>
        </div>
        <div>
          <label style={labelStyle}>CVC</label>
          <div style={inputWrapper}><CardCvcElement /></div>
        </div>
      </div>
      {error && (
        <p style={{ margin: '0 0 12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(192,57,43,0.08)', color: '#C0392B', fontSize: '12px', fontWeight: 600 }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={!stripe || loading}
        style={{
          width: '100%', height: '48px', border: 'none', borderRadius: '10px',
          background: loading ? '#5D6D7E' : '#1A1A2E', color: '#FFF',
          fontSize: '14px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}>
        {loading ? 'Procesando...' : 'Confirmar Pago $20 USD'}
      </button>
    </form>
  );
}

export default PostularModal;
