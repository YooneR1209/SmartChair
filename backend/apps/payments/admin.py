from django.contrib import admin
from .models import Pago

@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'monto', 'moneda', 'estado', 'creado_en')
    list_filter = ('estado', 'moneda')
    search_fields = ('usuario__username', 'stripe_payment_intent_id')
    readonly_fields = ('stripe_payment_intent_id', 'stripe_charge_id', 'stripe_refund_id')
