from django.urls import path
from .views import (
    PonenciaListCreateView, PonenciaCreateView, PonenciaDetailView,
    CambiarEstadoView, ConfirmarPagoView, EnviarCambiosView,
)
from .certificate_views import CertificadoListView, CertificadoDescargarView

urlpatterns = [
    # Creación sin conferencia
    path('ponencias/',                                PonenciaCreateView.as_view(),     name='ponencia-create'),

    # Listado y creación agrupados por conferencia
    path('<slug:slug>/ponencias/',                    PonenciaListCreateView.as_view(), name='ponencia-list'),

    # Operaciones sobre una ponencia concreta
    path('ponencias/<int:pk>/',                       PonenciaDetailView.as_view(),     name='ponencia-detail'),
    path('ponencias/<int:pk>/cambiar-estado/',        CambiarEstadoView.as_view(),       name='ponencia-cambiar-estado'),
    path('ponencias/<int:pk>/confirmar-pago/',        ConfirmarPagoView.as_view(),       name='ponencia-confirmar-pago'),
    path('ponencias/<int:pk>/enviar-cambios/',        EnviarCambiosView.as_view(),       name='ponencia-enviar-cambios'),

    # Certificados
    path('certificados/',                             CertificadoListView.as_view(),     name='certificado-list'),
    path('certificados/<int:ponencia_id>/descargar/', CertificadoDescargarView.as_view(), name='certificado-descargar'),
]
