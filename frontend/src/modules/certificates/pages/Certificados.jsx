import { useEffect, useState } from 'react';
import { postulaciones, certificados } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/ToastContext';
import { on } from '../../../shared/services/events';

function normalizeStatus(raw) {
  if (!raw) return 'enviado';
  const s = raw.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, (c) => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' })[c] || c);
  if (s.includes('acept') || s.includes('aprob')) return 'aceptada';
  return s;
}

function Certificados() {
  const { addToast } = useToast();
  const [approvedList, setApprovedList] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await postulaciones.misPostulaciones();
        const list = Array.isArray(data) ? data : [];
        const approved = list.filter((s) => normalizeStatus(s.estado) === 'aceptada');
        setApprovedList(approved);
      } catch { setApprovedList([]); }
      finally { setLoading(false); }
    };
    load();
    const unsub1 = on('ponencia:actualizada', load);
    const unsub2 = on('review:completada', load);
    return () => { unsub1(); unsub2(); };
  }, []);

  const handleDownload = async (item) => {
    setDownloading(item.id);
    try {
      const url = certificados.descargar(item.id);
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Error al descargar');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `certificado-${item.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      addToast('Certificado descargado', 'success');
    } catch {
      window.open(`/api/certificados/${item.id}/descargar/`, '_blank');
      addToast('Abriendo certificado en nueva pestaña', 'info');
    }
    finally { setDownloading(null); }
  };

  const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', marginBottom: '6px' }}>
          Dashboard {'>'} Certificados
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E', margin: 0, lineHeight: 1.2 }}>
          Certificados
        </h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: '14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>sync</span>
          Cargando...
        </div>
      ) : approvedList.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E8EB',
          borderRadius: '12px',
          padding: '64px 48px',
          textAlign: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#D0D0D0', display: 'block', marginBottom: '16px' }}>verified</span>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#2C3E50', margin: '0 0 6px' }}>No tienes certificados disponibles</p>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
            Los certificados aparecerán aquí cuando una de tus ponencias sea aceptada.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {approvedList.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E8EB',
                borderLeft: '3px solid #1E8449',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {item.area_tematica && (
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#F2F4F4', color: '#5D6D7E' }}>
                      {item.area_tematica}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF' }}>#{item.id}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '999px', background: '#E8F5E9', color: '#1E8449', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#1E8449' }} />
                    Aceptada
                  </span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>
                  {item.titulo || 'Sin título'}
                </h3>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                  {formatDate(item.postulada_en || item.fecha_creacion)}
                </p>
              </div>
              <button
                onClick={() => handleDownload(item)}
                disabled={downloading === item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: downloading === item.id ? 'wait' : 'pointer',
                  background: '#1E8449',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  opacity: downloading === item.id ? 0.7 : 1,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {downloading === item.id ? 'sync' : 'download'}
                </span>
                {downloading === item.id ? 'Descargando...' : 'Descargar Certificado'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Certificados;
