from django.urls import path
from .views import PonenciaListCreateView, PonenciaDetailView, CambiarEstadoView, ConfirmarPagoView, EnviarCambiosView, DescargarArchivoView

urlpatterns = [
    path('',                                      PonenciaListCreateView.as_view(), name='ponencia-list'),
    path('<int:pk>/',                             PonenciaDetailView.as_view(),     name='ponencia-detail'),
    path('<int:pk>/descargar/',                   DescargarArchivoView.as_view(),   name='ponencia-descargar'),
    path('<int:pk>/cambiar-estado/',              CambiarEstadoView.as_view(),       name='ponencia-cambiar-estado'),
    path('<int:pk>/confirmar-pago/',              ConfirmarPagoView.as_view(),       name='ponencia-confirmar-pago'),
    path('<int:pk>/enviar-cambios/',              EnviarCambiosView.as_view(),       name='ponencia-enviar-cambios'),
]
