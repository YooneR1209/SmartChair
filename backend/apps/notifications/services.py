import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import EmailLog

logger = logging.getLogger(__name__)

def _enviar(
    *,
    destinatario,
    tipo,
    asunto,
    template_html,
    context=None,
    template_text=None,
    objeto_tipo=None,
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


def enviar_bienvenida(user):
    #display_name = user.get_full_name() or user.get_username()
    #display_name = getattr(user, "email", "Usuario")

    #YA FUNCABA
    # display_name = (
    #         getattr(user, "get_full_name", lambda: None)()
    #         or getattr(user, "name", None)
    #         or getattr(user, "email", None)
    #         or "Usuario"
    # )

    display_name = getattr(user, "nombre", None) or getattr(user, "name", None) or user.email


    return _enviar(
        destinatario=user.email,
        tipo=EmailLog.Tipo.BIENVENIDA,
        asunto="Bienvenido a EasyChair",
        template_html="emails/bienvenida.html",
        template_text="emails/bienvenida.txt",
        context={"user": user, "display_name": display_name},
        objeto_tipo=user._meta.label,
        objeto_id=user.pk,
    )