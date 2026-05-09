from django.db import models
from django.conf import settings

class Pago(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        COMPLETADO = "completado", "Completado"
        REEMBOLSADO = "reembolsado", "Reembolsado"
        FALLIDO = "fallido", "Fallido"

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pagos'
    )
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)
    stripe_refund_id = models.CharField(max_length=255, blank=True)
    monto = models.DecimalField(max_digits=8, decimal_places=2)
    moneda = models.CharField(max_length=3, default="usd")
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    referencia_tipo = models.CharField(max_length=50, blank=True)
    referencia_id = models.IntegerField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.usuario} - {self.monto} {self.moneda} - {self.estado}"