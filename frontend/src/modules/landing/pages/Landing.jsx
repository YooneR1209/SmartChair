import { useEffect } from 'react';
import { useNavigate } from 'react-router';

const S = {
  body: { fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontWeight: 400, backgroundColor: '#fcf8fa', color: '#1c1b1d', WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility' },
};

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      const header = document.querySelector('header');
      if (!header) return;
      if (window.scrollY > 50) {
        header.style.paddingTop = '8px';
        header.style.paddingBottom = '8px';
      } else {
        header.style.paddingTop = '16px';
        header.style.paddingBottom = '16px';
      }
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const linkStyle = { color: 'inherit', textDecoration: 'none' };

  return (
    <div style={S.body}>
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .academic-shadow {
          box-shadow: 0px 4px 12px rgba(26, 26, 46, 0.05);
        }
        .dotted-connector {
          background-image: linear-gradient(to right, #D4AC0D 50%, transparent 50%);
          background-size: 10px 2px;
          background-repeat: repeat-x;
        }
        html { scroll-behavior: smooth; }
        @media (max-width: 639px) {
          .hero-title { font-size: 32px !important; line-height: 1.15 !important; }
          .hero-desc { font-size: 15px !important; line-height: 22px !important; }
          .section-title { font-size: 24px !important; line-height: 32px !important; }
          .features-grid [style*="padding: 32px"],
          .features-grid [style*="padding:32px"] { padding: 20px !important; }
          nav[style*="padding-left: 24px"] { padding-left: 12px !important; padding-right: 12px !important; }
          nav[style*="height: 80px"] { height: auto !important; min-height: 60px !important; }
          section[style*="padding-top: 80px"] { padding-top: 48px !important; padding-bottom: 48px !important; }
        }
      `}</style>

      {/* TOP NAVBAR */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        backgroundColor: 'rgba(26,26,46,0.9)', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        paddingTop: '16px', paddingBottom: '16px', transition: 'all 0.2s',
      }}>
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingLeft: '24px', paddingRight: '24px',
          maxWidth: '1280px', margin: '0 auto', height: '80px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', lineHeight: '32px', fontWeight: 700, color: '#ffffff' }}>SmartChair</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D4AC0D', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Academic Conference Portal</span>
          </div>
          <div style={{ display: 'none', alignItems: 'center', gap: '32px' }}
            className="md-flex">
            <a href="#features" style={{ ...linkStyle, fontSize: '16px', lineHeight: '24px', color: 'rgba(255,255,255,0.8)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffdea6'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>
              Características
            </a>
            <a href="#process" style={{ ...linkStyle, fontSize: '16px', lineHeight: '24px', color: 'rgba(255,255,255,0.8)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffdea6'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>
              Proceso
            </a>
            <a href="#roles" style={{ ...linkStyle, fontSize: '16px', lineHeight: '24px', color: 'rgba(255,255,255,0.8)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffdea6'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>
              Roles
            </a>
            <a href="#contact" style={{ ...linkStyle, fontSize: '16px', lineHeight: '24px', color: 'rgba(255,255,255,0.8)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffdea6'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>
              Contacto
            </a>
          </div>
          <style>{`
            @media (min-width: 768px) {
              .md-flex { display: flex !important; }
            }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '4px 16px', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px', fontWeight: 600, fontSize: '16px', lineHeight: '24px',
                background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => navigate('/registro')}
              style={{
                padding: '4px 16px', backgroundColor: '#9A6F00', color: '#ffffff',
                borderRadius: '6px', fontWeight: 600, fontSize: '16px', lineHeight: '24px',
                border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B38000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#9A6F00'; }}
            >
              Registrarse
            </button>
          </div>
        </nav>
      </header>

      {/* SECTION 1: HERO */}
      <section style={{
        position: 'relative', minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,26,46,0.65)', zIndex: 10 }}></div>
          <img
            alt="Library"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5GLUifEDr9GC-IjA-GSkBdc-CoQzQA_YtAtIeXOZR9wXXFb7k4Z_XQVU_XmNh1LAnfyQW1Mk3uJecNzgrVQsmm1ASWaJCcOFCB2kKFUu-8ykxzU5MKGX5dNA9Pfq-ewYwEAErF7M_ElChe70e9Ep465u8FF1xpk_Z-6Bv4WkUWGz8lbmEFlqEpMPxaYWo7IkqjFxlc91DWLZeCf_EkXgcW2xdcnMDWiLu868DTohbgR-NjPxb6u4xBayzNMgJXAd6ttb9fhChJyw"
          />
        </div>
        <div style={{
          position: 'relative', zIndex: 20, maxWidth: '1200px',
          margin: '0 auto', paddingLeft: '24px', paddingRight: '24px', textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 16px', marginBottom: '24px',
            border: '1px solid #D4AC0D', borderRadius: '9999px',
            backgroundColor: 'rgba(212,172,13,0.1)',
          }}>
            <span style={{
              color: '#D4AC0D', fontSize: '12px', lineHeight: '16px',
              letterSpacing: '0.05em', fontWeight: 600, textTransform: 'uppercase',
            }}>
              Sistema de Gestión Académica
            </span>
          </div>
          <h1 className="hero-title" style={{
            fontSize: '56px', lineHeight: '1.1', color: '#ffffff',
            fontWeight: 700, marginBottom: '16px', maxWidth: '960px',
            marginLeft: 'auto', marginRight: 'auto',
            fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em',
          }}>
            Gestiona Conferencias Académicas con Precisión
          </h1>
          <p className="hero-desc" style={{
            fontSize: '18px', lineHeight: '28px', color: 'rgba(255,255,255,0.8)',
            marginBottom: '32px', maxWidth: '576px', marginLeft: 'auto', marginRight: 'auto',
            fontWeight: 400,
          }}>
            Plataforma integral para la gestión de ponencias, revisión por pares ciegos y certificación académica de estándares internacionales.
          </p>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '16px', marginBottom: '32px',
          }} className="hero-ctas">
            <style>{`
              @media (min-width: 640px) {
                .hero-ctas { flex-direction: row !important; }
              }
            `}</style>
            <button
              onClick={() => navigate('/registro')}
              style={{
                width: '100%', padding: '16px 32px', backgroundColor: '#9A6F00',
                color: '#ffffff', fontSize: '16px', lineHeight: '24px',
                fontWeight: 700, border: 'none', borderRadius: '6px',
                cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B38000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#9A6F00'; }}
            >
              Comenzar Ahora
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '16px 32px', border: '2px solid #ffffff',
                color: '#ffffff', fontSize: '16px', lineHeight: '24px',
                fontWeight: 700, borderRadius: '6px', background: 'transparent',
                cursor: 'pointer', transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Ver Demo
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#D4AC0D', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span style={{ color: '#ffffff', fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', fontWeight: 600 }}>Revisión por Pares Ciegos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#D4AC0D', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span style={{ color: '#ffffff', fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', fontWeight: 600 }}>Pagos Seguros con Stripe</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#D4AC0D', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span style={{ color: '#ffffff', fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', fontWeight: 600 }}>Certificación Automática</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURES */}
      <section style={{ paddingTop: '80px', paddingBottom: '80px', backgroundColor: '#FDFAF2' }} id="features">
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <span style={{
              fontSize: '12px', lineHeight: '16px', color: '#9A6F00',
              textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px',
              display: 'block', fontWeight: 600,
            }}>
              Características
            </span>
            <h2 className="section-title" style={{
              fontSize: '32px', lineHeight: '40px', color: '#1A1A2E',
              marginBottom: '8px', fontWeight: 600, letterSpacing: '-0.01em',
            }}>
              Todo lo que necesitas en un solo lugar
            </h2>
            <p style={{
              fontSize: '16px', lineHeight: '24px', color: '#5D6D7E',
              maxWidth: '576px', margin: '0 auto',
            }}>
              SmartChair simplifica cada etapa del proceso de conferencias académicas, permitiéndote enfocarte en la calidad científica.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '24px',
          }} className="features-grid">
            <style>{`
              @media (min-width: 768px) {
                .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
              }
            `}</style>
            {[
              { icon: 'description', title: 'Gestión de Ponencias', desc: 'Sistema centralizado para el envío, rastreo y organización de documentos académicos y posters.' },
              { icon: 'search_insights', title: 'Revisión por Pares Ciegos', desc: 'Algoritmos de asignación inteligente que garantizan un proceso de evaluación imparcial y riguroso.' },
              { icon: 'credit_card', title: 'Pagos Integrados', desc: 'Gestión completa de inscripciones con pasarela de pagos internacional y facturación automática.' },
              { icon: 'emoji_events', title: 'Certificación Académica', desc: 'Emisión instantánea de certificados digitales con código QR de verificación para ponentes y asistentes.' },
            ].map((f) => (
              <div key={f.icon} className="academic-shadow" style={{
                backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px',
                border: '1px solid #E5E8EB', display: 'flex', alignItems: 'flex-start',
                gap: '16px', transition: 'transform 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{
                  width: '48px', height: '48px', backgroundColor: 'rgba(212,172,13,0.1)',
                  borderRadius: '9999px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ color: '#D4AC0D' }}>{f.icon}</span>
                </div>
                <div>
                  <h3 style={{
                    fontSize: '20px', lineHeight: '28px', color: '#1A1A2E',
                    marginBottom: '8px', fontWeight: 600,
                  }}>{f.title}</h3>
                  <p style={{ fontSize: '16px', lineHeight: '24px', color: '#5D6D7E' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section style={{ paddingTop: '80px', paddingBottom: '80px', backgroundColor: '#ffffff' }} id="process">
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <span style={{
              fontSize: '12px', lineHeight: '16px', color: '#9A6F00',
              textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px',
              display: 'block', fontWeight: 600,
            }}>
              Proceso
            </span>
            <h2 className="section-title" style={{
              fontSize: '32px', lineHeight: '40px', color: '#1A1A2E',
              fontWeight: 600, letterSpacing: '-0.01em',
            }}>
              ¿Cómo funciona SmartChair?
            </h2>
          </div>
          <div style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'space-between', gap: '32px',
          }} className="process-steps">
            <style>{`
              @media (min-width: 768px) {
                .process-steps { flex-direction: row !important; gap: 16px !important; }
              }
            `}</style>
            <div className="hidden-md dotted-connector" style={{
              position: 'absolute', top: '40px', left: '10%', right: '10%',
              height: '2px', zIndex: 0,
            }}></div>
            <style>{`
              @media (min-width: 768px) {
                .hidden-md { display: block !important; }
              }
              @media (max-width: 767px) {
                .hidden-md { display: none !important; }
              }
            `}</style>
            {[
              { num: '01', title: 'Regístrate', desc: 'Crea tu perfil académico en segundos.' },
              { num: '02', title: 'Postula', desc: 'Sube tu resumen o documento completo.' },
              { num: '03', title: 'Revisión', desc: 'Expertos evalúan la calidad científica.' },
              { num: '04', title: 'Veredicto', desc: 'Recibe resultados y certificación.' },
            ].map((s) => (
              <div key={s.num} style={{
                position: 'relative', zIndex: 10, display: 'flex',
                flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                maxWidth: '200px',
              }}>
                <div className="academic-shadow" style={{
                  width: '80px', height: '80px', backgroundColor: '#1A1A2E',
                  color: '#ffffff', borderRadius: '9999px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '20px', marginBottom: '16px',
                  border: '4px solid #ffffff',
                }}>
                  {s.num}
                </div>
                <h4 style={{
                  fontSize: '20px', lineHeight: '28px', color: '#1A1A2E',
                  marginBottom: '4px', fontWeight: 600,
                }}>{s.title}</h4>
                <p style={{ fontSize: '14px', lineHeight: '20px', color: '#5D6D7E' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: ROLES */}
      <section style={{ paddingTop: '80px', paddingBottom: '80px', backgroundColor: '#1A1A2E' }} id="roles">
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <span style={{
              fontSize: '12px', lineHeight: '16px', color: '#D4AC0D',
              textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px',
              display: 'block', fontWeight: 600,
            }}>
              Roles
            </span>
            <h2 className="section-title" style={{
              fontSize: '32px', lineHeight: '40px', color: '#ffffff',
              fontWeight: 600, letterSpacing: '-0.01em',
            }}>
              Una plataforma, cuatro roles
            </h2>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px',
          }} className="roles-grid">
            <style>{`
              @media (min-width: 640px) {
                .roles-grid { grid-template-columns: repeat(2, 1fr) !important; }
              }
              @media (min-width: 1024px) {
                .roles-grid { grid-template-columns: repeat(4, 1fr) !important; }
              }
            `}</style>
            {[
              { icon: 'person', title: 'AUTOR', desc: 'Investigadores y ponentes que buscan difundir su conocimiento.' },
              { icon: 'manage_search', title: 'REVISOR', desc: 'Expertos evaluadores que garantizan la excelencia del congreso.' },
              { icon: 'assignment_turned_in', title: 'ORGANIZADOR', desc: 'Gestores de conferencias coordinando el flujo de trabajo.' },
              { icon: 'settings_suggest', title: 'ADMINISTRADOR', desc: 'Control total del sistema y configuración de parámetros institucionales.' },
            ].map((r) => (
              <div key={r.title} style={{
                backgroundColor: '#252545', borderTop: '4px solid #D4AC0D',
                padding: '24px', borderRadius: '12px', height: '100%',
                display: 'flex', flexDirection: 'column', transition: 'transform 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <span className="material-symbols-outlined" style={{ color: '#D4AC0D', marginBottom: '16px', fontSize: '32px' }}>{r.icon}</span>
                <h3 style={{
                  fontSize: '20px', lineHeight: '28px', color: '#ffffff',
                  marginBottom: '4px', fontWeight: 600,
                }}>{r.title}</h3>
                <p style={{
                  fontSize: '14px', lineHeight: '20px', color: 'rgba(255,255,255,0.6)',
                  marginBottom: '16px', flexGrow: 1,
                }}>{r.desc}</p>
                <a href="#" style={{
                  color: '#D4AC0D', fontWeight: 600, fontSize: '14px', lineHeight: '20px',
                  display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}>
                  Más info
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', transition: 'transform 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}>
                    arrow_forward
                  </span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: FOOTER */}
      <footer style={{ backgroundColor: '#0D0D1A', color: '#ffffff', paddingTop: '80px', paddingBottom: '16px' }} id="contact">
        <div style={{
          maxWidth: '1280px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px',
          display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '24px', marginBottom: '32px',
        }} className="footer-grid">
          <style>{`
            @media (min-width: 768px) {
              .footer-grid { grid-template-columns: repeat(4, 1fr) !important; }
            }
          `}</style>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '24px', lineHeight: '32px', fontWeight: 700, display: 'block', color: '#ffffff' }}>SmartChair</span>
              <span style={{ color: '#D4AC0D', fontSize: '14px', lineHeight: '20px', fontWeight: 600, letterSpacing: '0.025em' }}>Academic Systems &amp; Conference Portal</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '20px' }}>
              Plataforma académica líder para la gestión eficiente de conferencias científicas y revisión rigurosa por pares.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '20px', lineHeight: '28px', color: '#ffffff', marginBottom: '16px', fontWeight: 600 }}>Enlaces Rápidos</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '20px' }}>
              {['Características', 'Cómo funciona', 'Roles', 'Precios'].map((item, i) => (
                <li key={item}>
                  <a href={['#features', '#process', '#roles', '#'][i]} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AC0D'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '20px', lineHeight: '28px', color: '#ffffff', marginBottom: '16px', fontWeight: 600 }}>Contacto Institucional</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '20px' }}>
              <li>Universidad Nacional de Loja</li>
              <li>Desarrollo Basado en Plataformas</li>
              <li>Ciclo 5A — 2024</li>
              <li>Loja, Ecuador</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '20px', lineHeight: '28px', color: '#ffffff', marginBottom: '16px', fontWeight: 600 }}>Soporte</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '20px' }}>
              {['Documentación', 'Centro de Ayuda', 'Términos de Servicio', 'Privacidad'].map((item) => (
                <li key={item}>
                  <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AC0D'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px',
          maxWidth: '1280px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px',
          textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: '20px' }}>
            &copy; 2024 SmartChair &mdash; Universidad Nacional de Loja. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
