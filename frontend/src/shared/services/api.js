const API_URL = import.meta.env.VITE_API_URL || '/api';

export function getToken() {
  return localStorage.getItem('token');
}

export function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...options.headers };
  const config = { ...options, headers };
  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.detail || data?.message || `Error ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export const auth = {
  login: (email, password) =>
    request('/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  registro: (data) =>
    request('/auth/registro/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  logout: () =>
    request('/auth/logout/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }),
  perfil: () => request('/auth/perfil/me/'),
  actualizarPerfil: (data) =>
    request('/auth/perfil/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  cambiarPassword: (data) =>
    request('/auth/perfil/password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};

export const conferencias = {
  listar: () => request('/conferencias/'),
  detalle: (slug) => request(`/conferencias/${slug}/`),
  crear: (data) =>
    request('/conferencias/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  editar: (slug, data) =>
    request(`/conferencias/${slug}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  eliminar: (slug) =>
    request(`/conferencias/${slug}/`, { method: 'DELETE' }),
  clonar: (slug) =>
    request(`/conferencias/${slug}/desde-plantilla/`, { method: 'POST' }),
  invitarRevisor: (slug, email) =>
    request(`/conferencias/${slug}/invitar-revisor/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
  listarRevisores: (slug) => request(`/conferencias/${slug}/revisores/`),
  aceptarInvitacion: (token) =>
    request(`/conferencias/invitaciones/${token}/aceptar/`, { method: 'POST' }),
  listarPonencias: (slug) => request(`/conferencias/${slug}/ponencias/`),
  postular: (slug, formData) =>
    request(`/conferencias/${slug}/ponencias/`, {
      method: 'POST',
      body: formData,
    }),
  inscribir: (slug, data = {}) =>
    request(`/conferencias/${slug}/inscribir/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  enviarCambios: (ponenciaId, formData) =>
    request(`/conferencias/ponencias/${ponenciaId}/enviar-cambios/`, {
      method: 'POST',
      body: formData,
    }),
  listarParticipantes: (slug) => request(`/conferencias/${slug}/participantes/`),
};

export const postulaciones = {
  misPostulaciones: () => request('/mis-postulaciones/'),
  detalle: (id) => request(`/mis-postulaciones/${id}/`),
};

export const reviews = {
  misAsignaciones: () => request('/reviews/mis-asignaciones/'),
  completar: (id, data) =>
    request(`/reviews/${id}/completar/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  verVeredicto: (ponenciaId) => request(`/reviews/veredicto/${ponenciaId}/`),
  emitirVeredicto: (ponenciaId, data) =>
    request(`/reviews/veredicto/${ponenciaId}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  asignarRevisor: (data) =>
    request('/reviews/asignar/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  asignarAutomatico: (ponenciaId) =>
    request(`/reviews/asignar-automatico/${ponenciaId}/`, { method: 'POST' }),
  detalle: (revisionId) => request(`/reviews/${revisionId}/`),
  revisionesPorPonencia: (ponenciaId) => request(`/reviews/ponencia/${ponenciaId}/`),
};

export const payments = {
  listar: () => request('/payments/pagos/'),
  detalle: (id) => request(`/payments/pagos/${id}/`),
  crear: (data) =>
    request('/payments/crear/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  confirmar: (data) =>
    request('/payments/confirmar/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  reembolsar: (id) =>
    request(`/payments/pagos/${id}/reembolsar/`, { method: 'POST' }),
  recibo: (id) => request(`/payments/pagos/${id}/recibo/`),
};

export const certificados = {
  listar: () => request('/certificados/'),
  descargar: (id) => `${API_URL}/certificados/${id}/descargar/`,
};

export const admin = {
  stats: () => request('/auth/admin/stats/'),
  usuarios: (search = '') => request(`/auth/admin/usuarios/${search ? '?search=' + encodeURIComponent(search) : ''}`),
  cambiarRol: (usuarioId, rol) =>
    request(`/auth/admin/usuarios/${usuarioId}/rol/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol }),
    }),
  toggleEstado: (usuarioId) =>
    request(`/auth/admin/usuarios/${usuarioId}/estado/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }),
  postulaciones: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/auth/admin/postulaciones/${params ? '?' + params : ''}`);
  },
  pagos: () => request('/auth/admin/pagos/'),
};

export const notifications = {
  testBienvenida: () =>
    request('/notifications/test/bienvenida/', { method: 'POST' }),
  testAsignacion: () =>
    request('/notifications/test/asignacion-revisor/', { method: 'POST' }),
  testVeredicto: () =>
    request('/notifications/test/veredicto/', { method: 'POST' }),
};
