from django.urls import path

from apps.notifications.views import (
    test_bienvenida,
    test_asignacion_revisor,
    test_veredicto,
    test_cambio_fecha,
    test_paper_reenviado,
    listar_notificaciones,
    marcar_leida,
    marcar_todas_leidas,
)

urlpatterns = [
    path("test/bienvenida/",test_bienvenida),
    path("test/asignacion-revisor/",test_asignacion_revisor),
    path("test/veredicto/",test_veredicto),
    path("test/cambio-fecha/",test_cambio_fecha),
    path("test/paper-reenviado/",test_paper_reenviado),
    path('', listar_notificaciones, name='listar-notificaciones'),
    path('<int:pk>/leer/', marcar_leida, name='marcar-leida'),
    path('leer-todas/', marcar_todas_leidas, name='marcar-todas-leidas'),
]