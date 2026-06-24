# apps/reviews/tests.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from unittest.mock import patch, MagicMock

from .models import AsignacionRevisor, Revision, Veredicto
from .services import (
    asignar_revisor,
    completar_revision,
    verificar_y_emitir_veredicto,
)

User = get_user_model()

def _make_user(email):
    return User.objects.create_user(
        email=email, password="test1234"
    )


class AsignarRevisorTests(TestCase):
    """RF-13/14: Tests de asignación de revisores."""

    def setUp(self):
        self.autor = _make_user("autor@test.com")
        self.revisor1 = _make_user("rev1@test.com")
        self.revisor2 = _make_user("rev2@test.com")

        self.ponencia = MagicMock()
        self.ponencia.id = 1
        self.ponencia.pk = 1
        self.ponencia.autor_principal = self.autor
        self.ponencia.area_tematica = "IA"

    def test_no_puede_asignar_autor_como_revisor(self):
        """RF-13: el autor no puede ser su propio revisor."""
        with self.assertRaises(ValidationError) as ctx:
            asignar_revisor(self.ponencia, self.autor)
        self.assertIn("no puede ser el autor", str(ctx.exception))

    def test_no_puede_superar_maximo_revisores(self):
        """RF-14: no se pueden asignar más revisores del máximo."""
        with self.assertRaises(ValidationError) as ctx:
            from unittest.mock import patch
            with patch(
                    "apps.reviews.services.AsignacionRevisor.objects.filter"
            ) as mock_filter:
                mock_filter.return_value.count.return_value = 5  # ya hay 5
                asignar_revisor(self.ponencia, self.revisor1)
        self.assertIn("máximo", str(ctx.exception))


class CompletarRevisionTests(TestCase):
    """RF-15: Tests de completar revisión."""

    def setUp(self):
        autor = _make_user("autor2@test.com")
        revisor = _make_user("rev2@test.com")
        organizador = _make_user("org2@test.com")

        ponencia = MagicMock()
        ponencia.autor_principal = autor
        ponencia.pago_completado = False

        asignacion = MagicMock()
        asignacion.revisor = revisor
        asignacion.ponencia = ponencia

        self.revision = MagicMock(spec=Revision)
        self.revision.asignacion = asignacion
        self.revision.estado = Revision.Estado.PENDIENTE
        self.revision.esta_completa.return_value = False

    def test_no_puede_completar_dos_veces(self):
        """RF-15: no se puede completar una revisión ya completada."""
        self.revision.esta_completa.return_value = True
        with self.assertRaises(ValidationError) as ctx:
            completar_revision(
                self.revision, "aceptado", "buen trabajo", "", {}
            )
        self.assertIn("ya fue completada", str(ctx.exception))


class ParesCiegosTests(TestCase):
    """RF-17: Tests de revisión por pares ciegos vía serializers."""

    def test_revisor_serializer_no_expone_autor(self):
        """El serializer del revisor no debe tener campos del autor."""
        from .serializers import RevisionParaRevisorSerializer
        campos = RevisionParaRevisorSerializer.Meta.fields
        campos_prohibidos = ("autor", "autor_email", "autores_adicionales")
        for campo in campos_prohibidos:
            self.assertNotIn(
                campo, campos,
                msg=f"El campo '{campo}' NO debe exponerse al revisor (RF-17).",
            )

    def test_veredicto_serializer_no_expone_revisor(self):
        """El serializer del autor no debe tener el campo emitido_por."""
        from .serializers import VeredictoParaAutorSerializer
        campos = VeredictoParaAutorSerializer.Meta.fields
        self.assertNotIn(
            "emitido_por", campos,
            msg="El campo 'emitido_por' NO debe exponerse al autor (RF-17).",
        )