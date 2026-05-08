from django.urls import path
from .views import (
    ConferenciaListCreateView, ConferenciaDetailView,
    ConferenciaDesdeTemplateView, ParticipantesView,
    InvitarRevisorView, AceptarInvitacionView,
)

urlpatterns = [
    path('',                              ConferenciaListCreateView.as_view(),  name='conferencia-list'),
    path('<slug:slug>/',                  ConferenciaDetailView.as_view(),      name='conferencia-detail'),
    path('<slug:slug>/desde-plantilla/',  ConferenciaDesdeTemplateView.as_view(), name='conferencia-desde-plantilla'),
    path('<slug:slug>/participantes/',    ParticipantesView.as_view(),          name='conferencia-participantes'),
    path('<slug:slug>/invitar-revisor/',  InvitarRevisorView.as_view(),         name='invitar-revisor'),
    path('invitaciones/<str:token>/aceptar/', AceptarInvitacionView.as_view(), name='aceptar-invitacion'),
]