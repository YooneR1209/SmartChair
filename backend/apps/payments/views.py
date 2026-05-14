import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .services import crear_payment_intent, confirmar_pago_desde_webhook
from .serializers import CrearPagoSerializer

class CrearPagoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CrearPagoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        pago = crear_payment_intent(
            usuario=request.user,
            monto_centavos=int(data["monto"] * 100),
            moneda=data.get("moneda", "usd"),
            referencia_tipo=data.get("referencia_tipo", ""),
            referencia_id=data.get("referencia_id"),
        )
        return Response({
            "client_secret": pago.client_secret,
            "pago_id": pago.id,
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        try:
            event = stripe.Webhook.construct_event(
                payload, sig, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event["type"] == "payment_intent.succeeded":
            pi = event["data"]["object"]
            charge_id = pi.get("latest_charge", "")
            confirmar_pago_desde_webhook(pi["id"], charge_id)

        return Response({"status": "ok"})