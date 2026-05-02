from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegistroView, PerfilView, CambiarPasswordView, LogoutView, MiPerfilView

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
]