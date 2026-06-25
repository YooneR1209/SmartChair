import logging
import random
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import VerificacionEmail, User


logger = logging.getLogger(__name__)
TOKEN_LENGTH = 48
TOKEN_EXPIRY_HOURS = 24


def generar_token():
    return secrets.token_urlsafe(TOKEN_LENGTH)


def generar_codigo():
    return f"{random.randint(100000, 999999)}"


def crear_verificacion(usuario):
    token = generar_token()
    codigo = generar_codigo()
    VerificacionEmail.objects.update_or_create(
        usuario=usuario,
        defaults={'token': token, 'codigo': codigo, 'creado_en': timezone.now()},
    )
    return token, codigo


def enviar_correo_verificacion(usuario):
    token, codigo = crear_verificacion(usuario)
    link = f"{settings.FRONTEND_URL}/verificar?token={token}"

    asunto = "Confirma tu correo electrónico - SmartChair"
    context = {
        "display_name": usuario.nombre_completo,
        "codigo": codigo,
        "link": link,
        "frontend_url": settings.FRONTEND_URL,
    }
    html = render_to_string("emails/verificacion.html", context)
    text = strip_tags(html)

    send_mail(
        subject=asunto,
        message=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[usuario.email],
        html_message=html,
        fail_silently=False,
    )

    if "console" in settings.EMAIL_BACKEND:
        logger.info(
            "📧 Código de verificación para %s → %s",
            usuario.email, codigo,
        )

    try:
        from apps.notifications.models import EmailLog
        EmailLog.objects.create(
            destinatario=usuario.email,
            tipo=EmailLog.TipoEmail.VERIFICACION,
            asunto=asunto,
            estado=EmailLog.Estado.ENVIADO,
            enviado_en=timezone.now(),
            objeto_tipo="User",
            objeto_id=usuario.id,
        )
    except Exception:
        logger.warning("No se pudo registrar EmailLog", exc_info=True)


def verificar_por_codigo(email, codigo):
    try:
        v = VerificacionEmail.objects.get(
            usuario__email=email, codigo=codigo
        )
    except VerificacionEmail.DoesNotExist:
        return None, "Código incorrecto."

    expiracion = v.creado_en + timedelta(hours=TOKEN_EXPIRY_HOURS)
    if timezone.now() > expiracion:
        v.delete()
        return None, "El código ha expirado. Solicita uno nuevo."

    usuario = v.usuario
    usuario.is_active = True
    usuario.save(update_fields=["is_active"])
    v.delete()
    return usuario, None


def verificar_por_token(token):
    try:
        v = VerificacionEmail.objects.get(token=token)
    except VerificacionEmail.DoesNotExist:
        return None, "El enlace de verificación no es válido."

    expiracion = v.creado_en + timedelta(hours=TOKEN_EXPIRY_HOURS)
    if timezone.now() > expiracion:
        v.delete()
        return None, "El enlace de verificación ha expirado."

    usuario = v.usuario
    usuario.is_active = True
    usuario.save(update_fields=["is_active"])
    v.delete()
    return usuario, None
