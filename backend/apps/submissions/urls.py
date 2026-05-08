from django.urls import path
from .views import (
    PonenciaListCreateView, PonenciaDetailView,
    CambiarEstadoView, ConfirmarPagoView, EnviarCambiosView,
)

urlpatterns = [
    # Listado y creación agrupados por conferencia
    path('<slug:slug>/ponencias/',                    PonenciaListCreateView.as_view(), name='ponencia-list'),

    # Operaciones sobre una ponencia concreta
    path('ponencias/<int:pk>/',                       PonenciaDetailView.as_view(),     name='ponencia-detail'),
    path('ponencias/<int:pk>/cambiar-estado/',        CambiarEstadoView.as_view(),       name='ponencia-cambiar-estado'),
    path('ponencias/<int:pk>/confirmar-pago/',        ConfirmarPagoView.as_view(),       name='ponencia-confirmar-pago'),
    path('ponencias/<int:pk>/enviar-cambios/',        EnviarCambiosView.as_view(),       name='ponencia-enviar-cambios'),
]
