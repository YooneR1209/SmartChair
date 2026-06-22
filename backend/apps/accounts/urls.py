from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegistroView, PerfilView, CambiarPasswordView, LogoutView, MiPerfilView
from .admin_views import (
    AdminUsuariosView, AdminCambiarRolView, AdminToggleEstadoView,
    AdminStatsView, AdminPostulacionesView, AdminPagosView,
)

urlpatterns = [
    # Auth
    path('registro/',          RegistroView.as_view(),        name='registro'),
    path('login/',             TokenObtainPairView.as_view(), name='login'),
    path('login/refresh/',     TokenRefreshView.as_view(),    name='token-refresh'),
    path('logout/',            LogoutView.as_view(),          name='logout'),
    # Perfil
    path('perfil/',            PerfilView.as_view(),          name='perfil'),
    path('perfil/me/',         MiPerfilView.as_view(),        name='perfil-me'),
    path('perfil/password/',   CambiarPasswordView.as_view(), name='cambiar-password'),
    # Admin
    path('admin/stats/',                       AdminStatsView.as_view(),          name='admin-stats'),
    path('admin/usuarios/',                    AdminUsuariosView.as_view(),        name='admin-usuarios'),
    path('admin/usuarios/<int:usuario_id>/rol/',     AdminCambiarRolView.as_view(),   name='admin-cambiar-rol'),
    path('admin/usuarios/<int:usuario_id>/estado/',  AdminToggleEstadoView.as_view(), name='admin-toggle-estado'),
    path('admin/postulaciones/',               AdminPostulacionesView.as_view(),   name='admin-postulaciones'),
    path('admin/pagos/',                       AdminPagosView.as_view(),           name='admin-pagos'),
]