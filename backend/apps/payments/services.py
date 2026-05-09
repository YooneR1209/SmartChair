import stripe
from django.conf import settings
from .models import Pago

stripe.api_key = settings.STRIPE_SECRET_KEY

def crear_payment_intent(usuario, monto_centavos: int, moneda: str = "usd", referencia_tipo: str = "", referencia_id: int = None):
    intent = stripe.PaymentIntent.create(
        amount=monto_centavos,
        currency=moneda,
        metadata={
            "usuario_id": str(usuario.id),
            "referencia_tipo": referencia_tipo,
            "referencia_id": str(referencia_id or ""),
        }
    )
    pago = Pago.objects.create(
        usuario=usuario,
        stripe_payment_intent_id=intent["id"],
        monto=monto_centavos / 100,
        moneda=moneda,
        referencia_tipo=referencia_tipo,
        referencia_id=referencia_id,
    )
    pago.client_secret = intent["client_secret"]
    return pago

def confirmar_pago_desde_webhook(payment_intent_id: str, charge_id: str):
    try:
        pago = Pago.objects.get(stripe_payment_intent_id=payment_intent_id)
        pago.stripe_charge_id = charge_id
        pago.estado = Pago.Estado.COMPLETADO
        pago.save()
        return pago
    except Pago.DoesNotExist:
        return None

def reembolsar_pago(pago: Pago):
    if pago.estado != Pago.Estado.COMPLETADO:
        raise ValueError("Solo se pueden reembolsar pagos completados.")
    refund = stripe.Refund.create(charge=pago.stripe_charge_id)
    pago.stripe_refund_id = refund["id"]
    pago.estado = Pago.Estado.REEMBOLSADO
    pago.save()
    return pago