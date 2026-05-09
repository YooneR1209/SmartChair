from django.urls import path
from .views import CrearPagoView, StripeWebhookView

urlpatterns = [
    path('crear/', CrearPagoView.as_view(), name='crear-pago'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
]