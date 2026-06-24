from django.urls import path
from .certificate_views import CertificadoListView, CertificadoDescargarView

urlpatterns = [
    path('certificados/',                             CertificadoListView.as_view(),     name='certificado-list'),
    path('certificados/<int:ponencia_id>/descargar/', CertificadoDescargarView.as_view(), name='certificado-descargar'),
]
