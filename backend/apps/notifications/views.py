from django.shortcuts import render

from rest_framework.decorators import api_view
from rest_framework.response import Response

# ----Bienvenida---
from apps.notifications.services import enviar_bienvenida
from apps.accounts.models import User

# ----Asignacion revisor---
from apps.notifications.services import enviar_asignacion_revisor
from apps.conferences.models import Conferencia

from django.utils import timezone
import datetime

#--------Veredicto------------
from apps.notifications.services import enviar_veredicto

#-------- Paper reenviado------------
from apps.notifications.services import enviar_paper_reenviado

#--------Cambio fecha ------------
from apps.notifications.services import enviar_cambio_fecha
#-------- ------------

#para tests desde insomnia ( omitir con SMTP real)
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
#----------------------------------------

# Create your views here.
#([IsAuthenticated]) produccion real || ([AllowAny]) Tests Locales desde insomnia
#en insomnia se deberia enviar Authorization: Bearer <token>

@api_view(["POST"])
@permission_classes([AllowAny])
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


@api_view(["POST"])
@permission_classes([AllowAny])
def test_asignacion_revisor(request):

    try:

        user = User.objects.get(id=request.data["user_id"])

        conf, created = Conferencia.objects.get_or_create(
            slug="conf-prueba-2026",
            defaults={
                "nombre": "Congreso de Tecnología UNL 2026",
                "organizador": user,
                "fecha_inicio": timezone.now().date(),
                "fecha_fin": timezone.now().date() + datetime.timedelta(days=5),
                "estado": "abierta"
            }
        )

        class MockPonencia:
            id = 1
            pk = 1
            titulo = request.data.get(
                "titulo",
                "Impacto de la IA en la Educación Superior"
            )

            _meta = type(
                'Meta',
                (),
                {'object_name': 'Ponencia'}
            )

        ponencia_mock = MockPonencia()

        log = enviar_asignacion_revisor(
            revisor=user,
            conferencia=conf,
            ponencia=ponencia_mock
        )

        return Response({
            "ok": log.estado == "enviado",
            "estado": log.estado,
            "email_log_id": log.id,
        })

    except Exception as e:
        return Response({
            "ok": False,
            "error": str(e)
        }, status=500)

@api_view(["POST"])
@permission_classes([AllowAny])
def test_veredicto(request):

    try:

        autor = User.objects.get(id=request.data["user_id"])

        class MockPonencia:
            id = 20
            pk = 20

            titulo = request.data.get(
                "titulo",
                "Revisión Anónima en Sistemas de Conferencias"
            )

            _meta = type(
                'Meta',
                (),
                {'object_name': 'Ponencia'}
            )

        ponencia_mock = MockPonencia()

        feedback = request.data.get(
            "feedback",
            [
                "Buen enfoque metodológico.",
                "Se recomienda mejorar la sección de resultados.",
                "Faltan referencias recientes."
            ]
        )

        log = enviar_veredicto(
            autor=autor,
            ponencia=ponencia_mock,
            veredicto=request.data.get("veredicto", "aceptado"),
            feedback_anonimo=feedback
        )

        return Response({
            "ok": log.estado == "enviado",
            "estado": log.estado,
            "email_log_id": log.id,
        })

    except Exception as e:
        return Response({
            "ok": False,
            "error": str(e)
        }, status=500)

@api_view(["POST"])
@permission_classes([AllowAny])
def test_paper_reenviado(request):

    try:

        autor = User.objects.get(id=request.data["user_id"])

        class MockPonencia:
            id = 40
            pk = 40

            titulo = request.data.get(
                "titulo",
                "Sistema de revision academica"
            )

            _meta = type(
                'Meta',
                (),
                {'object_name': 'Ponencia'}
            )

        ponencia_mock = MockPonencia()

        log = enviar_paper_reenviado(
            autor,
            ponencia_mock
        )

        return Response({
            "ok": log.estado == "enviado",
            "estado": log.estado,
            "email_log_id": log.id,
        })

    except Exception as e:
        return Response({
            "ok": False,
            "error": str(e)
        }, status=500)

@api_view(["POST"])
@permission_classes([AllowAny])
def test_cambio_fecha(request):

    try:

        user = User.objects.get(id=request.data["user_id"])

        conf, created = Conferencia.objects.get_or_create(
            slug="conf-fechas-2026",
            defaults={
                "nombre": "Congreso de Software 2026",
                "organizador": user,
                "fecha_inicio": timezone.now().date(),
                "fecha_fin": timezone.now().date() + datetime.timedelta(days=3),
                "estado": "abierta"
            }
        )

        conf.fecha_inicio = (
            conf.fecha_inicio + datetime.timedelta(days=7)
        )

        conf.fecha_fin = (
            conf.fecha_fin + datetime.timedelta(days=7)
        )

        conf.save()

        log = enviar_cambio_fecha(user, conf)

        return Response({
            "ok": log.estado == "enviado",
            "estado": log.estado,
            "email_log_id": log.id,
        })

    except Exception as e:
        return Response({
            "ok": False,
            "error": str(e)
        }, status=500)