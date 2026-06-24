from django.urls import path
from .views import PonenciaCreateView, PonenciaDetailView, CambiarEstadoView, ConfirmarPagoView, EnviarCambiosView, DescargarArchivoView

urlpatterns = [
    path('',                                      PonenciaCreateView.as_view(),     name='ponencia-create'),
    path('<int:pk>/',                             PonenciaDetailView.as_view(),     name='ponencia-detail'),
    path('<int:pk>/descargar/',                   DescargarArchivoView.as_view(),   name='ponencia-descargar'),
    path('<int:pk>/cambiar-estado/',              CambiarEstadoView.as_view(),       name='ponencia-cambiar-estado'),
    path('<int:pk>/confirmar-pago/',              ConfirmarPagoView.as_view(),       name='ponencia-confirmar-pago'),
    path('<int:pk>/enviar-cambios/',              EnviarCambiosView.as_view(),       name='ponencia-enviar-cambios'),
]
