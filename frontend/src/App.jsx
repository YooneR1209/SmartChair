import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import Landing from './modules/landing/pages/Landing';
import Login from './modules/auth/pages/Login';
import Register from './modules/auth/pages/Register';
import VerificarCuenta from './modules/auth/pages/VerificarCuenta';

import ProtectedRoute from './modules/auth/components/ProtectedRoute';
import { ToastProvider } from './shared/components/ToastContext';
import Dashboard from './modules/dashboard/pages/Dashboard';
import MisPonencias from './modules/submissions/pages/MisPonencias';
import Conferencias from './modules/conferences/pages/Conferencias';
import DetalleConferencia from './modules/conferences/pages/DetalleConferencia';
import AceptarInvitacion from './modules/conferences/pages/AceptarInvitacion';
import MisRevisiones from './modules/reviews/pages/MisRevisiones';
import Pagos from './modules/payments/pages/Pagos';
import Certificados from './modules/certificates/pages/Certificados';
import Perfil from './modules/profile/pages/Perfil';
import AdminPanel from './modules/admin/pages/AdminPanel';
import GestionarPostulaciones from './modules/submissions/pages/GestionarPostulaciones';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/verificar" element={<VerificarCuenta />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/mis-ponencias" element={<ProtectedRoute><MisPonencias /></ProtectedRoute>} />
        <Route path="/conferencias" element={<ProtectedRoute><Conferencias /></ProtectedRoute>} />
        <Route path="/conferencias/:slug" element={<ProtectedRoute><DetalleConferencia /></ProtectedRoute>} />
        <Route path="/mis-revisiones" element={<ProtectedRoute><MisRevisiones /></ProtectedRoute>} />
        <Route path="/pagos" element={<ProtectedRoute><Pagos /></ProtectedRoute>} />
        <Route path="/certificados" element={<ProtectedRoute><Certificados /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="ADMINISTRADOR"><AdminPanel /></ProtectedRoute>} />
        <Route path="/gestionar-postulaciones" element={<ProtectedRoute><GestionarPostulaciones /></ProtectedRoute>} />

        <Route path="/invitacion/:token" element={<ProtectedRoute><AceptarInvitacion /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
