# apps/reviews/urls.py

from django.urls import path
from .views import (
    AsignarRevisorView,
    AsignarAutomaticoView,
    MisAsignacionesView,
    DetalleRevisionView,
    CompletarRevisionView,
    RevisionesPonenciaView,
    VeredictoView,
)

urlpatterns = [
    # RF-13: Asignación manual de revisor
    path("asignar/", AsignarRevisorView.as_view(), name="reviews-asignar"),

    # RF-13: Asignación automática por área temática
    path(
        "asignar-automatico/<int:ponencia_id>/",
        AsignarAutomaticoView.as_view(),
        name="reviews-asignar-automatico",
    ),

    # Lista las ponencias asignadas al revisor autenticado
    path(
        "mis-asignaciones/",
        MisAsignacionesView.as_view(),
        name="reviews-mis-asignaciones",
    ),

    # Detalle de una revisión (solo el revisor asignado)
    path(
        "<int:revision_id>/",
        DetalleRevisionView.as_view(),
        name="reviews-detalle",
    ),

    # RF-15: El revisor envía su evaluación
    path(
        "<int:revision_id>/completar/",
        CompletarRevisionView.as_view(),
        name="reviews-completar",
    ),

    # RF-17: Lista revisiones de una ponencia (solo organizador)
    path(
        "ponencia/<int:ponencia_id>/",
        RevisionesPonenciaView.as_view(),
        name="reviews-por-ponencia",
    ),

    # RF-15/16: Ver o emitir veredicto de una ponencia
    path(
        "veredicto/<int:ponencia_id>/",
        VeredictoView.as_view(),
        name="reviews-veredicto",
    ),
]