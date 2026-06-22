import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { postulaciones, conferencias, reviews, admin, certificados, getToken } from '../../../shared/services/api';
import { on } from '../../../shared/services/events';
import { STATUS_MAP, normalizeStatus, Stepper } from '../../../shared/utils/statusMap.jsx';

function StatCard({ label, value, icon, subtitle, subtitleColor }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E8EB',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#5D6D7E', marginBottom: '2px' }}>
            {label}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A1A2E', lineHeight: 1 }}>
            {value}
          </div>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#9CA3AF', marginTop: '2px' }}>{icon}</span>
      </div>
      {subtitle && (
        <div style={{ fontSize: '11px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: subtitleColor || '#5D6D7E' }}>
          {subtitleColor === '#1E8449' && (
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
          )}
          {subtitle}
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E8EB',
  borderRadius: '12px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

function Dashboard() {
  const navigate = useNavigate();
  const profileRaw = localStorage.getItem('profile');
  const profile = profileRaw ? JSON.parse(profileRaw) : null;
  const userRole = (localStorage.getItem('selectedRole') || profile?.rol || 'AUTOR').toUpperCase();

  const [submissions, setSubmissions] = useState([]);
  const [confList, setConfList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminStatsData, setAdminStatsData] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);

  const loadData = async () => {
    try {
      const calls = [conferencias.listar().catch(() => [])];

      if (userRole === 'AUTOR') {
        calls.push(postulaciones.misPostulaciones().catch(() => []));
      } else if (userRole === 'ORGANIZADOR') {
        calls.push(admin.postulaciones().catch(() => []));
      } else {
        calls.push(Promise.resolve([]));
      }

      if (userRole === 'REVISOR') {
        calls.push(reviews.misAsignaciones().catch(() => []));
      } else {
        calls.push(Promise.resolve([]));
      }

      const adminStatsPromise = userRole === 'ADMINISTRADOR' ? admin.stats().catch(() => null) : Promise.resolve(null);
      const adminUsersPromise = userRole === 'ADMINISTRADOR' ? admin.usuarios().catch(() => []) : Promise.resolve([]);
      calls.push(adminStatsPromise);
      calls.push(adminUsersPromise);

      const [confData, subData, revData, aStats, aUsers] = await Promise.all(calls);
      setConfList(Array.isArray(confData) ? confData : []);
      setSubmissions(Array.isArray(subData) ? subData : []);
      setAssignments(Array.isArray(revData) ? revData : []);
      setAdminStatsData(aStats);
      setAdminUsers(Array.isArray(aUsers) ? aUsers : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    const unsub = on('review:completada', loadData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      unsub();
    };
  }, []);

  const stats = useMemo(() => {
    const total = submissions.length;
    const enRevision = submissions.filter((s) => normalizeStatus(s.estado) === 'en_revision').length;
    const veredictos = submissions.filter((s) => {
      const n = normalizeStatus(s.estado);
      return n === 'aceptada' || n === 'rechazada' || n === 'aceptada_con_cambios' || n === 'cambios_enviados';
    }).length;
    const aprobadas = submissions.filter((s) => normalizeStatus(s.estado) === 'aceptada').length;
    const now = new Date();
    const thisMonthCount = submissions.filter((s) => {
      const d = s.postulada_en || s.fecha_creacion;
      if (!d) return false;
      const date = new Date(d);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    return { total, enRevision, veredictos, aprobadas, thisMonthCount };
  }, [submissions]);

  const revStats = useMemo(() => {
    const total = assignments.length;
    const pendientes = assignments.filter((a) => {
      const est = (a.estado_revision || '').toLowerCase();
      return est === 'pendiente' || est === '' || est === 'asignado' || !est;
    }).length;
    const completadas = assignments.filter((a) => {
      const est = (a.estado_revision || '').toLowerCase();
      return est === 'completada' || est === 'completado';
    }).length;
    return { total, pendientes, completadas };
  }, [assignments]);

  const orgStats = useMemo(() => {
    const total = confList.length;
    const activas = confList.filter((c) => {
      const est = (c.estado || c.estatus || '').toLowerCase();
      return est === 'activa' || est === 'activo' || est === 'publicada' || est === 'abierta';
    }).length;
    const participantes = confList.reduce((sum, c) => sum + (c.num_participantes || c.participantes_count || 0), 0);
    const ponencias = submissions.length || confList.reduce((sum, c) => sum + (c.num_ponencias || c.ponencias_count || 0), 0);
    return { total, activas, participantes, ponencias };
  }, [confList, submissions]);

  const recentSubs = submissions.slice(0, 3);
  const recentConfs = confList.slice(0, 3);
  const recentAssignments = assignments.slice(0, 3);
  const recentAdminUsers = adminUsers.slice(0, 5);

  const breadcrumb = (
    <div style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', marginBottom: '6px' }}>
      Inicio {'>'} Dashboard
    </div>
  );

  const pageTitle = (
    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E', margin: 0, lineHeight: 1.2 }}>
      Dashboard
    </h1>
  );

  const loadingState = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: '14px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>sync</span>
      Cargando...
    </div>
  );

  const emptyCard = (icon, msg, btnLabel, btnAction) => (
    <div style={{ ...cardStyle, alignItems: 'center', textAlign: 'center', padding: '48px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#D0D0D0' }}>{icon}</span>
      <p style={{ fontSize: '14px', color: '#5D6D7E', margin: 0 }}>{msg}</p>
      <button
        onClick={btnAction}
        style={{
          padding: '8px 20px',
          borderRadius: '8px',
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
          background: '#9A6F00',
        }}
      >
        {btnLabel}
      </button>
    </div>
  );

  const sectionHeader = (title, linkLabel, linkTo) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
        {title}
      </h2>
      <button
        onClick={() => navigate(linkTo)}
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#9A6F00',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {linkLabel} →
      </button>
    </div>
  );

  const fechaImportante = (color, mes, dia, title, desc) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid #F2F4F4' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '60px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: color }} />
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color }}>{mes}</span>
        <span style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A2E', lineHeight: 1 }}>{dia}</span>
      </div>
      <div>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#2C3E50', margin: 0 }}>{title}</p>
        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0 0' }}>{desc}</p>
      </div>
    </div>
  );

  const sidebarFechas = (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
        Fechas Importantes
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {fechaImportante('#C0392B', 'OCT', '15', 'Cierre de Recepción', 'Conferencia Internacional')}
        {fechaImportante('#D4AC0D', 'NOV', '02', 'Anuncio de Veredictos', 'Revisión por pares')}
        {fechaImportante('#1E8449', 'DIC', '10', 'Envío Versión Final', 'Auditorio UNL')}
      </div>
    </div>
  );

  const sidebarCTA = (
    <div style={cardStyle}>
      <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', color: '#D4AC0D' }}>edit_note</span>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>
        ¿Listo para participar?
      </h3>
      <p style={{ fontSize: '11px', color: '#5D6D7E', margin: '0 0 16px', lineHeight: 1.6 }}>
        Comparte tus hallazgos con la comunidad académica global.
      </p>
      <button
        onClick={() => navigate('/mis-ponencias')}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: '8px',
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
          background: '#9A6F00',
        }}
      >
        + Nueva Participación
      </button>
    </div>
  );

  const sidebarRevStats = (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
        Resumen de Revisiones
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F2F4F4' }}>
          <span style={{ fontSize: '12px', color: '#5D6D7E' }}>Total Asignadas</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E' }}>{revStats.total}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F2F4F4' }}>
          <span style={{ fontSize: '12px', color: '#D4AC0D' }}>Pendientes</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#D4AC0D' }}>{revStats.pendientes}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#1E8449' }}>Completadas</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#1E8449' }}>{revStats.completadas}</span>
        </div>
      </div>
    </div>
  );

  const sidebarOrgCTA = (
    <div style={cardStyle}>
      <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', color: '#D4AC0D' }}>add_circle</span>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>
        ¿Nueva Conferencia?
      </h3>
      <p style={{ fontSize: '11px', color: '#5D6D7E', margin: '0 0 16px', lineHeight: 1.6 }}>
        Organiza un nuevo evento académico.
      </p>
      <button
        onClick={() => navigate('/conferencias')}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: '8px',
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
          background: '#9A6F00',
        }}
      >
        Crear Conferencia
      </button>
    </div>
  );

  const sidebarAdminLinks = (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
        Acceso Rápido
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { label: 'Ir a Usuarios', icon: 'group', path: '/admin?tab=usuarios' },
          { label: 'Ir a Conferencias', icon: 'event', path: '/admin?tab=conferencias' },
          { label: 'Ir a Postulaciones', icon: 'description', path: '/admin?tab=postulaciones' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              background: '#F5F7FA',
              color: '#1A1A2E',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF9E7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F7FA'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9A6F00' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate('/admin')}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: '8px',
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
          background: '#9A6F00',
          marginTop: '8px',
        }}
      >
        Ver Panel de Administración
      </button>
    </div>
  );

  const renderSubmissionCard = (sub) => {
    const key = normalizeStatus(sub.estado);
    const st = STATUS_MAP[key] || STATUS_MAP.enviado;
    return (
      <div
        key={sub.id}
        onClick={() => { const s = sub.conferencia_slug ? `/mis-ponencias?ponencia=${sub.id}` : '/mis-ponencias'; navigate(s); }}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E8EB',
          borderLeft: `3px solid ${st.border}`,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {sub.area_tematica && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#F2F4F4',
                color: '#5D6D7E',
              }}
            >
              {sub.area_tematica}
            </span>
          )}
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF' }}>#{sub.id}</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: '999px',
              background: st.badge.bg,
              color: st.badge.text,
              border: `1px solid ${st.badge.text}22`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: st.badge.dot,
              }}
            />
            {st.badge.label}
          </span>
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', margin: 0, lineHeight: 1.3 }}>
          {sub.titulo || 'Sin título'}
        </h3>
        <Stepper steps={st.steps} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {key === 'aceptada' && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const token = getToken();
                const resp = await fetch(certificados.descargar(sub.id), {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!resp.ok) return;
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificado-${sub.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: '#1E8449',
                color: '#FFFFFF',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'text-bottom', marginRight: '4px' }}>download</span>
              Descargar Certificado
            </button>
          )}
          {key === 'rechazada' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/mis-ponencias?ponencia=${sub.id}`);
              }}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: '#C0392B',
                color: '#FFFFFF',
              }}
            >
              Ver Feedback
            </button>
          )}
          {key === 'aceptada_con_cambios' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (sub.conferencia_slug) {
                  navigate(`/conferencias/${sub.conferencia_slug}`);
                } else {
                  navigate('/conferencias');
                }
              }}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: '#D4AC0D',
                color: '#FFFFFF',
              }}
            >
              Reenviar con Cambios
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAssignmentCard = (asg) => {
    const estRev = asg.estado_revision || '';
    const isPendiente = !estRev || estRev.toLowerCase() === 'pendiente' || estRev.toLowerCase() === 'asignado';
    const isCompletada = estRev && (estRev.toLowerCase() === 'completada' || estRev.toLowerCase() === 'completado');
    return (
      <div
        key={asg.id}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E8EB',
          borderLeft: `3px solid ${isCompletada ? '#1E8449' : '#D4AC0D'}`,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          transition: 'box-shadow 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {asg.area_tematica && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#F2F4F4',
                color: '#5D6D7E',
              }}
            >
              {asg.area_tematica}
            </span>
          )}
          {asg.conferencia?.nombre && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#FEF9E7',
                color: '#9A6F00',
              }}
            >
              {asg.conferencia.nombre}
            </span>
          )}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: '999px',
              background: isCompletada ? '#E8F5E9' : '#FEF9E7',
              color: isCompletada ? '#1E8449' : '#D4AC0D',
              border: `1px solid ${isCompletada ? '#1E8449' : '#D4AC0D'}22`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isCompletada ? '#1E8449' : '#D4AC0D',
              }}
            />
            {isCompletada ? 'Completada' : 'Pendiente'}
          </span>
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', margin: 0, lineHeight: 1.3 }}>
          {asg.titulo_ponencia || asg.titulo || 'Sin título'}
        </h3>
        <p style={{ fontSize: '12px', color: '#5D6D7E', margin: 0 }}>
          {asg.conferencia?.nombre || 'Conferencia no especificada'}
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={() => navigate('/mis-revisiones')}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: isCompletada ? '#5D6D7E' : '#D4AC0D',
              color: '#FFFFFF',
            }}
          >
            {isCompletada ? 'Ver Detalle' : 'Iniciar Revisión'}
          </button>
        </div>
      </div>
    );
  };

  const renderConfCard = (conf) => {
    const fechaInicio = conf.fecha_inicio ? new Date(conf.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const fechaFin = conf.fecha_fin ? new Date(conf.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const est = (conf.estado || conf.estatus || '').toLowerCase();
    const isActive = est === 'activa' || est === 'activo' || est === 'publicada' || est === 'abierta';
    const slug = conf.slug || conf.id;
    return (
      <div
        key={conf.id || slug}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E8EB',
          borderLeft: `3px solid ${isActive ? '#1E8449' : '#5D6D7E'}`,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          transition: 'box-shadow 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
            {conf.nombre || 'Sin nombre'}
          </h3>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              background: isActive ? '#E8F5E9' : '#F2F4F4',
              color: isActive ? '#1E8449' : '#5D6D7E',
            }}
          >
            {isActive ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#5D6D7E' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>calendar_today</span>
            {fechaInicio} — {fechaFin}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/conferencias/${slug}`)}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: '#9A6F00',
              color: '#FFFFFF',
            }}
          >
            Gestionar
          </button>
          <button
            onClick={() => navigate(`/conferencias/${slug}`)}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: '#D4AC0D',
              color: '#1A1A2E',
            }}
          >
            Invitar Revisor
          </button>
          <button
            onClick={() => navigate('/mis-ponencias')}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: '#5D6D7E',
              color: '#FFFFFF',
            }}
          >
            Ver Postulaciones
          </button>
        </div>
      </div>
    );
  };

  const renderAdminUserRow = (u) => (
    <div
      key={u.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: '8px',
        background: '#F5F7FA',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: '#9A6F0D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '12px',
          color: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        {(u.nombre || u.email || 'U')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E' }}>
          {u.nombre || u.email || 'Sin nombre'}
        </div>
        <div style={{ fontSize: '11px', color: '#5D6D7E' }}>
          {u.email || ''}
        </div>
      </div>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '4px',
          background: u.rol === 'ADMINISTRADOR' ? '#FDEDEC' : '#F2F4F4',
          color: u.rol === 'ADMINISTRADOR' ? '#C0392B' : '#5D6D7E',
        }}
      >
        {u.rol || '—'}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {breadcrumb}
        {pageTitle}
        {loadingState}
      </div>
    );
  }

  if (userRole === 'AUTOR') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {breadcrumb}
        {pageTitle}

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <StatCard
            label="Ponencias Enviadas"
            value={stats.total}
            icon="description"
            subtitle={stats.thisMonthCount > 0 ? `+${stats.thisMonthCount} este mes` : null}
            subtitleColor="#1E8449"
          />
          <StatCard
            label="En Revisión"
            value={stats.enRevision}
            icon="schedule"
            subtitle={stats.enRevision > 0 ? `${stats.enRevision} pendiente${stats.enRevision !== 1 ? 's' : ''}` : 'Sin revisiones'}
          />
          <StatCard
            label="Veredictos Recibidos"
            value={stats.veredictos}
            icon="verified"
            subtitle={stats.aprobadas > 0 ? `${stats.aprobadas} Aprobada${stats.aprobadas !== 1 ? 's' : ''} de ${stats.veredictos}` : null}
            subtitleColor="#1E8449"
          />
        </div>

        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          <div>
            {sectionHeader('Mis Ponencias Recientes', 'Ver todas', '/mis-ponencias')}
            {recentSubs.length === 0
              ? emptyCard('description', 'No tienes ponencias todavía.', '+ Nueva Participación', () => navigate('/mis-ponencias'))
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{recentSubs.map(renderSubmissionCard)}</div>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sidebarFechas}
            {sidebarCTA}
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'REVISOR') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {breadcrumb}
        {pageTitle}

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <StatCard
            label="Revisiones Asignadas"
            value={revStats.total}
            icon="rate_review"
            subtitle={revStats.total > 0 ? `${revStats.total} asignada${revStats.total !== 1 ? 's' : ''}` : 'Sin asignaciones'}
          />
          <StatCard
            label="Pendientes"
            value={revStats.pendientes}
            icon="schedule"
            subtitle={revStats.pendientes > 0 ? `${revStats.pendientes} pendiente${revStats.pendientes !== 1 ? 's' : ''}` : 'Al día'}
            subtitleColor={revStats.pendientes > 0 ? '#C0392B' : '#1E8449'}
          />
          <StatCard
            label="Completadas"
            value={revStats.completadas}
            icon="check_circle"
            subtitle={revStats.completadas > 0 ? `${revStats.completadas} completada${revStats.completadas !== 1 ? 's' : ''}` : 'Aún sin completar'}
            subtitleColor="#1E8449"
          />
        </div>

        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          <div>
            {sectionHeader('Mis Revisiones Recientes', 'Ver todas', '/mis-revisiones')}
            {recentAssignments.length === 0
              ? emptyCard('rate_review', 'No tienes revisiones asignadas.', 'Ir a Conferencias', () => navigate('/conferencias'))
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{recentAssignments.map(renderAssignmentCard)}</div>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sidebarRevStats}
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'ORGANIZADOR') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {breadcrumb}
        {pageTitle}

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <StatCard
            label="Mis Conferencias"
            value={orgStats.total}
            icon="event"
            subtitle={orgStats.total > 0 ? `${orgStats.total} conferencia${orgStats.total !== 1 ? 's' : ''}` : 'Sin conferencias'}
          />
          <StatCard
            label="Participantes"
            value={orgStats.participantes > 0 ? orgStats.participantes : '—'}
            icon="group"
            subtitle={orgStats.participantes > 0 ? `${orgStats.participantes} en total` : 'Próximamente'}
          />
          <StatCard
            label="Ponencias"
            value={orgStats.ponencias > 0 ? orgStats.ponencias : '—'}
            icon="description"
            subtitle={`${orgStats.activas} conferencia${orgStats.activas !== 1 ? 's' : ''} activa${orgStats.activas !== 1 ? 's' : ''}`}
            subtitleColor="#1E8449"
          />
        </div>

        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          <div>
            {sectionHeader('Mis Conferencias', 'Ver todas', '/conferencias')}
            {recentConfs.length === 0
              ? emptyCard('event', 'No tienes conferencias aún.', 'Crear Conferencia', () => navigate('/conferencias'))
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{recentConfs.map(renderConfCard)}</div>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sidebarOrgCTA}
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'ADMINISTRADOR') {
    const aTotalUsuarios = adminStatsData?.total_usuarios ?? adminStatsData?.totalUsuarios ?? '—';
    const aTotalConferencias = adminStatsData?.total_conferencias ?? adminStatsData?.totalConferencias ?? '—';
    const aTotalPonencias = adminStatsData?.total_ponencias ?? adminStatsData?.totalPonencias ?? '—';
    const aTotalPagos = adminStatsData?.pagos_completados ?? '—';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {breadcrumb}
        {pageTitle}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard
            label="Total Usuarios"
            value={aTotalUsuarios}
            icon="group"
          />
          <StatCard
            label="Conferencias"
            value={aTotalConferencias}
            icon="event"
          />
          <StatCard
            label="Ponencias"
            value={aTotalPonencias}
            icon="description"
          />
          <StatCard
            label="Pagos Completados"
            value={aTotalPagos}
            icon="payments"
            subtitle={aTotalPagos !== '—' ? 'En el sistema' : null}
            subtitleColor="#1E8449"
          />
        </div>

        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          <div>
            {sectionHeader('Usuarios Recientes', 'Ver todos', '/admin?tab=usuarios')}
            {recentAdminUsers.length === 0
              ? emptyCard('group', 'No hay usuarios registrados.', 'Ir a Administración', () => navigate('/admin'))
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{recentAdminUsers.map(renderAdminUserRow)}</div>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sidebarAdminLinks}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {breadcrumb}
      {pageTitle}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: '#5D6D7E', fontSize: '14px' }}>
        Rol no reconocido.
      </div>
    </div>
  );
}

export default Dashboard;
