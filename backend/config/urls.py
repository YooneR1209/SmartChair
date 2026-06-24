from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
import os
from django.http import JsonResponse
from django.db import connections
from django.db.utils import OperationalError
from apps.submissions.views import MisPostulacionesView
from apps.submissions.certificate_views import CertificadoListView, CertificadoDescargarView

def health_check(request):
    return JsonResponse({"status": "ok"})

def db_check(request):
    db_conf = connections['default'].settings_dict
    relevant = {
        "HOST": db_conf.get("HOST"),
        "PORT": db_conf.get("PORT"),
        "NAME": db_conf.get("NAME"),
        "USER": db_conf.get("USER"),
        "ENGINE": db_conf.get("ENGINE"),
        "SSL": bool(db_conf.get("OPTIONS", {}).get("ssl")),
    }
    # Expose env var names (not values) for debugging
    env_candidates = ["DATABASE_URL", "MARIADB_URL", "MARIADB_PRIVATE_URL", "MYSQL_URL",
                      "MARIADB_HOST", "MYSQLHOST", "MYSQL_HOST", "MYSQL_ADDON_HOST",
                      "MARIADB_PORT", "MYSQLPORT", "MYSQL_PORT", "MYSQL_ADDON_PORT",
                      "MARIADB_DATABASE", "MARIADB_DB", "MYSQLDATABASE", "MYSQL_DATABASE"]
    env_status = {v: "SET" if os.getenv(v) else "MISSING" for v in env_candidates}
    try:
        connections['default'].cursor()
        return JsonResponse({"status": "ok", "db": "connected", "config": relevant, "env": env_status})
    except OperationalError as e:
        return JsonResponse({"status": "error", "db": str(e), "config": relevant, "env": env_status})

urlpatterns = [
    path('api/health/', health_check, name='health-check'),
    path('api/health/db/', db_check, name='db-check'),
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