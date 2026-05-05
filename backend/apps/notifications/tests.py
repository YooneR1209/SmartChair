from django.test import TestCase

from types import SimpleNamespace

from django.core import mail
from django.test import TestCase, override_settings

from apps.notifications.models import EmailLog
from apps.notifications.services import (
    _nombre_visible,
    enviar_asignacion_revisor,
    enviar_bienvenida,
    enviar_veredicto,
)

# Create your tests here.

@override_settings(
    DEFAULT_FROM_EMAIL="no-reply@smartchair.local",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="http://localhost:3000",
)
class NotificationsServiceTests(TestCase):
    def test_nombre_visible_usa_nombres_y_apellidos(self):
        user = SimpleNamespace(
            email="juan.perez@unl.edu.ec",
            nombres="Juan",
            apellidos="Perez",
        )

        self.assertEqual(_nombre_visible(user), "Juan Perez")

    def test_nombre_visible_usa_email_como_respaldo(self):
        user = SimpleNamespace(email="sin.nombre@unl.edu.ec")

        self.assertEqual(_nombre_visible(user), "sin.nombre@unl.edu.ec")

    def test_bienvenida_se_envia_y_registra_log(self):
        user = SimpleNamespace(
            id=1,
            email="test@unl.edu.ec",
            nombres="Juan",
            apellidos="Perez",
        )

        log = enviar_bienvenida(user)

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Bienvenido", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ["test@unl.edu.ec"])
        self.assertEqual(log.tipo, EmailLog.TipoEmail.BIENVENIDA)
        self.assertEqual(log.estado, EmailLog.Estado.ENVIADO)
        self.assertEqual(log.objeto_tipo, "User")
        self.assertEqual(log.objeto_id, 1)
        self.assertEqual(EmailLog.objects.count(), 1)

    def test_asignacion_revisor_se_envia_y_registra_log(self):
        revisor = SimpleNamespace(
            email="revisor@unl.edu.ec",
            nombres="Ana",
            apellidos="Lopez",
        )
        conferencia = SimpleNamespace(nombre="Congreso de Ingenieria")
        ponencia = SimpleNamespace(id=10, titulo="Arquitectura modular en Django")

        log = enviar_asignacion_revisor(revisor, conferencia, ponencia)

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Nueva asignacion", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ["revisor@unl.edu.ec"])
        self.assertIn("Ana Lopez", mail.outbox[0].body)
        self.assertIn("Congreso de Ingenieria", mail.outbox[0].body)
        self.assertEqual(log.tipo, EmailLog.TipoEmail.ASIGNACION_REVISOR)
        self.assertEqual(log.estado, EmailLog.Estado.ENVIADO)
        self.assertEqual(log.objeto_tipo, "Ponencia")
        self.assertEqual(log.objeto_id, 10)
        self.assertEqual(EmailLog.objects.count(), 1)

    def test_veredicto_se_envia_con_feedback_y_registra_log(self):
        autor = SimpleNamespace(
            email="autor@unl.edu.ec",
            nombres="Maria",
            apellidos="Torres",
        )
        ponencia = SimpleNamespace(id=20, titulo="Revision anonima de papers")
        feedback = ["Buen aporte metodologico.", "Mejorar las referencias."]

        log = enviar_veredicto(autor, ponencia, "aceptado", feedback)

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Veredicto", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ["autor@unl.edu.ec"])
        self.assertIn("ACEPTADO", mail.outbox[0].body)
        self.assertIn("Buen aporte metodologico.", mail.outbox[0].body)
        self.assertEqual(log.tipo, EmailLog.TipoEmail.VEREDICTO)
        self.assertEqual(log.estado, EmailLog.Estado.ENVIADO)
        self.assertEqual(log.objeto_tipo, "Ponencia")
        self.assertEqual(log.objeto_id, 20)
        self.assertEqual(EmailLog.objects.count(), 1)