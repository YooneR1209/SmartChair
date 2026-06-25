import logging
import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


class BrevoEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        api_key = getattr(settings, 'BREVO_API_KEY', '')
        if not api_key:
            logger.error("BREVO_API_KEY no configurada")
            return 0

        sent = 0
        for message in email_messages:
            try:
                payload = {
                    "sender": {"name": message.from_email.split("<")[0].strip() if "<" in message.from_email else message.from_email,
                               "email": message.from_email.split("<")[1].rstrip(">") if "<" in message.from_email else message.from_email},
                    "to": [{"email": addr} for addr in message.to],
                    "subject": message.subject,
                    "htmlContent": message.body if message.content_subtype == 'html' else '',
                    "textContent": message.body if message.content_subtype != 'html' else '',
                }

                if hasattr(message, 'alternatives') and message.alternatives:
                    for alt_content, alt_type in message.alternatives:
                        if alt_type == 'text/html':
                            payload["htmlContent"] = alt_content
                        elif alt_type == 'text/plain':
                            payload["textContent"] = alt_content

                resp = requests.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={
                        "api-key": api_key,
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30,
                )

                if resp.status_code not in (200, 201):
                    logger.error("Brevo API error %s: %s", resp.status_code, resp.text)
                else:
                    sent += 1
            except Exception:
                logger.exception("Error enviando email via Brevo API")
        return sent
