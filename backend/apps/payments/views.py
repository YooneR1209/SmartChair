import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .services import crear_payment_intent, confirmar_pago_desde_webhook
from .models import Pago
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


# ========== NUEVOS ENDPOINTS (FUERA DE LA CLASE) ==========

class ConfirmarPagoView(APIView):
    """Confirma un pago directamente tras confirmCardPayment (fallback sin webhook)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_intent_id = request.data.get("payment_intent_id")
        charge_id = request.data.get("charge_id")
        if not payment_intent_id:
            return Response({"error": "payment_intent_id es requerido"}, status=status.HTTP_400_BAD_REQUEST)

        # Validar que el pago pertenezca al usuario autenticado
        try:
            pago = Pago.objects.get(stripe_payment_intent_id=payment_intent_id, usuario=request.user)
        except Pago.DoesNotExist:
            return Response({"error": "Pago no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        pago.stripe_charge_id = charge_id or ""
        pago.estado = Pago.Estado.COMPLETADO
        pago.save()
        return Response({"estado": pago.estado, "pago_id": pago.id})


class ListarPagosView(APIView):
    """Lista todos los pagos del usuario autenticado"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pagos = Pago.objects.filter(usuario=request.user).order_by('-creado_en')

        data = []
        for pago in pagos:
            ref_tipo = pago.referencia_tipo or ""
            ref_id = pago.referencia_id
            data.append({
                "id": pago.id,
                "monto": str(pago.monto),
                "moneda": pago.moneda,
                "estado": pago.estado,
                "creado_en": pago.creado_en.isoformat(),
                "referencia_tipo": ref_tipo,
                "referencia_id": ref_id,
                "motivo": f"{ref_tipo} #{ref_id}" if ref_tipo and ref_id else (ref_tipo or "—"),
            })

        return Response(data, status=status.HTTP_200_OK)


class DetallePagoView(APIView):
    """Obtiene el detalle de un pago específico"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pago_id):
        from .models import Pago
        try:
            pago = Pago.objects.get(id=pago_id, usuario=request.user)

            data = {
                "id": pago.id,
                "usuario": pago.usuario.id,
                "monto": str(pago.monto),
                "moneda": pago.moneda,
                "estado": pago.estado,
                "stripe_payment_intent_id": pago.stripe_payment_intent_id,
                "stripe_charge_id": pago.stripe_charge_id,
                "stripe_refund_id": pago.stripe_refund_id,
                "creado_en": pago.creado_en.isoformat(),
            }
            return Response(data, status=status.HTTP_200_OK)

        except Pago.DoesNotExist:
            return Response(
                {"error": "Pago no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )


class ReciboPagoView(APIView):
    """Devuelve los datos del recibo de un pago completado."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pago_id):
        try:
            pago = Pago.objects.get(id=pago_id, usuario=request.user)
        except Pago.DoesNotExist:
            return Response({"error": "Pago no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if pago.estado != Pago.Estado.COMPLETADO:
            return Response({"error": "El pago no está completado"}, status=status.HTTP_400_BAD_REQUEST)

        data = {
            "id": pago.id,
            "recibo_numero": f"REC-{pago.id:05d}",
            "fecha": pago.creado_en.isoformat(),
            "usuario_nombre": pago.usuario.nombre_completo,
            "usuario_email": pago.usuario.email,
            "monto": str(pago.monto),
            "moneda": pago.moneda.upper(),
            "estado": pago.estado,
            "referencia_tipo": pago.referencia_tipo or "",
            "referencia_id": pago.referencia_id,
        }
        return Response(data, status=status.HTTP_200_OK)


class ReembolsarPagoView(APIView):
    """Reembolsa un pago completado"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pago_id):
        try:
            pago = Pago.objects.get(id=pago_id, usuario=request.user)
        except Pago.DoesNotExist:
            return Response(
                {"error": "Pago no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        if pago.estado != Pago.Estado.COMPLETADO:
            return Response(
                {"error": "Solo se pueden reembolsar pagos completados"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refund = stripe.Refund.create(charge=pago.stripe_charge_id)

            pago.estado = Pago.Estado.REEMBOLSADO
            pago.stripe_refund_id = refund["id"]
            pago.save()

            return Response({
                "id": pago.id,
                "estado": pago.estado,
                "stripe_refund_id": refund["id"]
            }, status=status.HTTP_200_OK)

        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )