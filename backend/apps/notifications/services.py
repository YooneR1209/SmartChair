import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import EmailLog

logger = logging.getLogger(__name__)

#------------------------------------------------
# def _nombre_visible(user):
#     """Obtiene el nombre buscando en todos los campos posibles."""
#     if not user:
#         return "Usuario"
#
#     """Obtiene el nombre más descriptivo posible del usuario."""
#     nombre_completo = getattr(user, "nombre_completo", None)
#     if nombre_completo:
#         return nombre_completo() if callable(nombre_completo) else nombre_completo
#
#     nombres = getattr(user, "nombres", "") or getattr(user, "nombre", "") or getattr(user, "first_name", "")
#     apellidos = getattr(user, "apellidos", "") or getattr(user, "apellido", "") or getattr(user, "last_name", "")
#
#     nombre = f"{nombres} {apellidos}".strip()
#
#     #return nombre or getattr(user, "email", "") or str(user)
#     return nombre or getattr(user, "email", "") or getattr(user, "username", str(user))

def _nombre_visible(user):
    """Obtiene el nombre usando los campos reales de tu modelo: nombres y apellidos."""
    if not user:
        return "Usuario"

    # 1. Intentar método nombre_completo si existiera
    nombre_completo = getattr(user, "nombre_completo", None)
    if nombre_completo:
        return nombre_completo() if callable(nombre_completo) else nombre_completo

    # 2. Usar tus campos reales: nombres y apellidos (según tu dict_keys)
    n = getattr(user, "nombres", "").strip()
    a = getattr(user, "apellidos", "").strip()

    nombre_final = f"{n} {a}".strip()

    # 3. Fallback: si no tiene nombre, usar email, sino "Usuario"
    return nombre_final or getattr(user, "email", "") or "Usuario"


def _objeto_tipo(objeto, fallback=""):
    """Extrae el nombre del modelo de forma segura."""
    meta = getattr(objeto, "_meta", None)
    return getattr(meta, "object_name", fallback) if meta else fallback


def _objeto_id(objeto):
    """Extrae la clave primaria de forma segura."""
    return getattr(objeto, "pk", None) or getattr(objeto, "id", None)


# def _frontend_url():
#     """Obtiene la URL del frontend desde settings."""
#     return getattr(settings, "FRONTEND_URL", "")

def _frontend_url():
    return getattr(settings, "FRONTEND_URL", "http://localhost:5173")

#-----------------------------------------------

def _enviar(
    *,
    destinatario,
    tipo,
    asunto,
    template_html,
    context=None,
    template_text=None,
    objeto_tipo="", #objeto_tipo=None, ||Modificado: valor por defecto vacío
    objeto_id=None,
    from_email=None,
):
    """
    Envia un email HTML con alternativa en texto plano y registra el resultado.

    Las views deben llamar funciones publicas de este modulo, nunca construir
    ni enviar correos directamente.
    """
    context = context or {}
    from_email = from_email or settings.DEFAULT_FROM_EMAIL

    try:
        html_content = render_to_string(template_html, context)
        text_content = (
            render_to_string(template_text, context)
            if template_text
            else strip_tags(html_content)
        )

        email = EmailMultiAlternatives(
            subject=asunto,
            body=text_content,
            from_email=from_email,
            to=[destinatario],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

        return EmailLog.objects.create(
            destinatario=destinatario,
            tipo=tipo,
            asunto=asunto,
            estado=EmailLog.Estado.ENVIADO,
            enviado_en=timezone.now(),
            objeto_tipo=objeto_tipo,
            objeto_id=objeto_id,
        )
    except Exception as exc:
        logger.exception("Error enviando email %s a %s", tipo, destinatario)

        return EmailLog.objects.create(
            destinatario=destinatario,
            tipo=tipo,
            asunto=asunto,
            estado=EmailLog.Estado.ERROR,
            error_msg=str(exc),
            objeto_tipo=objeto_tipo,
            objeto_id=objeto_id,
        )


#def enviar_bienvenida(user): CHECK 104 && 116
    #display_name = user.get_full_name() or user.get_username()
    #display_name = getattr(user, "email", "Usuario")

    #YA FUNCABA
    # display_name = (
    #         getattr(user, "get_full_name", lambda: None)()
    #         or getattr(user, "name", None)
    #         or getattr(user, "email", None)
    #         or "Usuario"
    # )

    #display_name = getattr(user, "nombre", None) or getattr(user, "name", None) or user.email

def enviar_bienvenida(user):
        """Envía el correo de bienvenida utilizando las nuevas utilidades."""
        return _enviar(
            destinatario=user.email,
            tipo=EmailLog.Tipo.BIENVENIDA,
            asunto="Bienvenido a EasyChair",
            template_html="emails/bienvenida.html",
            template_text="emails/bienvenida.txt",
            context={
                "user": user,
                "display_name": _nombre_visible(user),
                "frontend_url": _frontend_url()
            },
            objeto_tipo=_objeto_tipo(user),
            objeto_id=_objeto_id(user),
        )

        # return _enviar(
        #     destinatario=user.email,
        #     tipo=EmailLog.Tipo.BIENVENIDA,
        #     asunto="Bienvenido a EasyChair",
        #     template_html="emails/bienvenida.html",
        #     template_text="emails/bienvenida.txt",
        #     context={"user": user, "display_name": display_name},
        #     objeto_tipo=user._meta.label,
        #     objeto_id=user.pk,
        # )

def enviar_asignacion_revisor(revisor, conferencia, ponencia):
    nombre_conferencia = getattr(conferencia, "nombre", "la conferencia")

    return _enviar(
        destinatario=revisor.email,
        tipo=EmailLog.TipoEmail.ASIGNACION_REVISOR,
        asunto=f"Nueva asignacion de revision - {nombre_conferencia}",
        template_html="emails/asignacion_revisor.html",
        template_text="emails/asignacion_revisor.txt",
        context={
            "revisor": revisor,
            # "revisor_nombre": _nombre_visible(revisor),  # SAME down
            "display_name": _nombre_visible(revisor),  # Cambiado para consistencia
            "conferencia": conferencia,
            "nombre_conferencia": nombre_conferencia,  # NEW Variable explícita para el template
            "ponencia": ponencia,
            "frontend_url": _frontend_url(),
        },
        objeto_tipo=_objeto_tipo(ponencia, "Ponencia"),
        objeto_id=_objeto_id(ponencia),
    )