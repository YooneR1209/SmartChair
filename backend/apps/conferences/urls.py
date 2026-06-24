from django.urls import path, include
from .views import (
    ConferenciaListCreateView, ConferenciaDetailView,
    ConferenciaDesdeTemplateView, ParticipantesView,
    InvitarRevisorView, AceptarInvitacionView,
    InscribirView, RevisoresDisponiblesView,
)

urlpatterns = [
    path('',                              ConferenciaListCreateView.as_view(),  name='conferencia-list'),
    path('ponencias/',                    include('apps.submissions.ponencias_urls')),
    path('<slug:slug>/',                  ConferenciaDetailView.as_view(),      name='conferencia-detail'),
    path('<slug:slug>/desde-plantilla/',  ConferenciaDesdeTemplateView.as_view(), name='conferencia-desde-plantilla'),
    path('<slug:slug>/participantes/',    ParticipantesView.as_view(),          name='conferencia-participantes'),
    path('<slug:slug>/revisores/',        RevisoresDisponiblesView.as_view(),   name='conferencia-revisores'),
    path('<slug:slug>/invitar-revisor/',  InvitarRevisorView.as_view(),         name='invitar-revisor'),
    path('<slug:slug>/inscribir/',        InscribirView.as_view(),              name='inscribir'),
    path('invitaciones/<str:token>/aceptar/', AceptarInvitacionView.as_view(), name='aceptar-invitacion'),
]