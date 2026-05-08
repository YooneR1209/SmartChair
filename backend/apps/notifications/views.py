from django.shortcuts import render

from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.notifications.services import enviar_bienvenida
from apps.accounts.models import User

#para tests desde insomnia ( omitir con SMTP real)
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
# -------

# Create your views here.
#([IsAuthenticated]) produccion real
#en insomnia se deberia enviar Authorization: Bearer <token>

@api_view(["POST"])
@permission_classes([AllowAny]) #acceso libre para pruebas locales desde insomnia o conosla
def test_bienvenida(request):
    try:
        user = User.objects.get(id=request.data["user_id"])

        log = enviar_bienvenida(user)

        return Response({
            "ok": log.estado == "enviado",
            "estado": log.estado,
            "email_log_id": log.id,
            "error_msg": log.error_msg,
        })

    except User.DoesNotExist:
        return Response({
            "ok": False,
            "error": "Usuario no encontrado"
        }, status=404)

    except Exception as e:
        return Response({
            "ok": False,
            "error": str(e)
        }, status=500)