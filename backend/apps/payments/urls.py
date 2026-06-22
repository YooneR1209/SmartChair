from django.urls import path
from .views import (
    CrearPagoView,
    StripeWebhookView,
    ListarPagosView,
    DetallePagoView,
    ReciboPagoView,
    ReembolsarPagoView,
    ConfirmarPagoView,
)

urlpatterns = [
    path('crear/', CrearPagoView.as_view(), name='crear-pago'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('confirmar/', ConfirmarPagoView.as_view(), name='confirmar-pago'),
    path('pagos/', ListarPagosView.as_view(), name='listar-pagos'),
    path('pagos/<int:pago_id>/', DetallePagoView.as_view(), name='detalle-pago'),
    path('pagos/<int:pago_id>/recibo/', ReciboPagoView.as_view(), name='recibo-pago'),
    path('pagos/<int:pago_id>/reembolsar/', ReembolsarPagoView.as_view(), name='reembolsar-pago'),
]