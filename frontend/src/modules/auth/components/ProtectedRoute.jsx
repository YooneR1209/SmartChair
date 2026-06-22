import { useState } from 'react';
import { Navigate } from 'react-router';
import Layout from '../../../shared/layout/Layout';
import RoleSelector from './RoleSelector';
import { useToast } from '../../../shared/components/ToastContext';

function ProtectedRoute({ children, requiredRole }) {
  const [showSelector, setShowSelector] = useState(() => !localStorage.getItem('selectedRole'));
  const { addToast } = useToast();

  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  const profileRaw = localStorage.getItem('profile');
  let profile = null;
  let userRole = null;
  if (profileRaw) {
    try {
      profile = JSON.parse(profileRaw);
      userRole = (profile?.rol || '').toUpperCase() || null;
    } catch {
      /* ignore invalid stored profile */
    }
  }

  if (requiredRole && userRole !== requiredRole && userRole !== 'ADMINISTRADOR') {
    if (requiredRole === 'REVISOR' && userRole !== 'REVISOR') {
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole === 'ADMINISTRADOR' && userRole !== 'ADMINISTRADOR') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const email = profile?.email || '';
  const displayName = profile?.nombre_completo || profile?.nombre || email.split('@')[0] || 'Usuario';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SC';

  const effectiveRole = localStorage.getItem('selectedRole') || userRole || 'AUTOR';

  const backendRole = (userRole || 'AUTOR').toUpperCase();

  const handleRoleSelect = (role) => {
    if (backendRole !== 'ADMINISTRADOR' && role !== backendRole) return;
    localStorage.setItem('selectedRole', role);
    setShowSelector(false);
    addToast(`¡Bienvenido, ${displayName}!`, 'success');
  };

  if (showSelector) {
    return <RoleSelector onSelect={handleRoleSelect} backendRole={backendRole} />;
  }

  return (
    <Layout
      userName={displayName}
      userInitials={initials}
      userRole={effectiveRole}
      profile={profile}
    >
      {children}
    </Layout>
  );
}

export default ProtectedRoute;
