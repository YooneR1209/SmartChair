from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from apps.submissions.views import MisPostulacionesView
from apps.submissions.certificate_views import CertificadoListView, CertificadoDescargarView

def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('api/health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/conferencias/', include('apps.conferences.urls')),
    path('api/conferencias/', include('apps.submissions.urls')),
    path('api/mis-postulaciones/', MisPostulacionesView.as_view(), name='mis-postulaciones'),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path("api/reviews/", include("apps.reviews.urls")),
    path('api/certificados/', CertificadoListView.as_view(), name='certificado-list'),
    path('api/certificados/<int:ponencia_id>/descargar/', CertificadoDescargarView.as_view(), name='certificado-descargar'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)