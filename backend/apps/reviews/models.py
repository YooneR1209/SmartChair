# apps/reviews/models.py

from django.db import models
from django.conf import settings


class AsignacionRevisor(models.Model):
    """RF-13/14: vincula un revisor con una ponencia específica."""

    ponencia = models.ForeignKey(
        "submissions.Ponencia",
        on_delete=models.CASCADE,
        related_name="asignaciones",
    )
    revisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="asignaciones_revision",
    )
    es_desempate = models.BooleanField(
        default=False,
        help_text="RF-14: True si este revisor fue asignado para romper un empate.",
    )
    asignado_en = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    class Meta:
        unique_together = ("ponencia", "revisor")
        verbose_name = "Asignación de revisor"
        verbose_name_plural = "Asignaciones de revisores"

    def __str__(self):
        return f"{self.revisor} → {self.ponencia}"


class Revision(models.Model):
    """RF-15/17/18: evaluación de una ponencia por un revisor."""

    class Veredicto(models.TextChoices):
        ACEPTADO = "aceptado", "Aceptado"
        RECHAZADO = "rechazado", "Rechazado"
        ACEPTADO_CON_CAMBIOS = "aceptado_con_cambios", "Aceptado con cambios"

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        EN_PROGRESO = "en_progreso", "En progreso"
        COMPLETADA = "completada", "Completada"

    asignacion = models.OneToOneField(
        AsignacionRevisor,
        on_delete=models.CASCADE,
        related_name="revision",
    )
    # RF-17: comentario_autor es anónimo — nunca exponer revisor al autor
    respuestas_rubrica = models.JSONField(
        default=dict,
        help_text="Respuestas a cada criterio de la rúbrica de la conferencia.",
    )
    comentario_privado = models.TextField(
        blank=True,
        help_text="Solo visible para el organizador. NUNCA se envía al autor.",
    )
    comentario_autor = models.TextField(
        blank=True,
        help_text="RF-18: feedback anónimo que sí recibe el autor.",
    )
    veredicto = models.CharField(
        max_length=25,
        choices=Veredicto.choices,
        blank=True,
    )
    estado = models.CharField(
        max_length=15,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    iniciada_en = models.DateTimeField(null=True, blank=True)
    completada_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Revisión"
        verbose_name_plural = "Revisiones"

    def __str__(self):
        return f"Revisión de {self.asignacion.ponencia} por {self.asignacion.revisor}"

    def esta_completa(self):
        return self.estado == self.Estado.COMPLETADA


class Veredicto(models.Model):
    """
    RF-15/16: resultado final consolidado de todas las revisiones.
    Una ponencia tiene como máximo un Veredicto.
    """

    class Resultado(models.TextChoices):
        ACEPTADO = "aceptado", "Aceptado"
        RECHAZADO = "rechazado", "Rechazado"
        ACEPTADO_CON_CAMBIOS = "aceptado_con_cambios", "Aceptado con cambios"

    ponencia = models.OneToOneField(
        "submissions.Ponencia",
        on_delete=models.CASCADE,
        related_name="veredicto",
    )
    emitido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="veredictos_emitidos",
    )
    resultado = models.CharField(max_length=25, choices=Resultado.choices)
    resumen_para_autor = models.TextField(
        blank=True,
        help_text="RF-18: síntesis anónima del feedback para el autor.",
    )
    plazo_cambios = models.DateField(
        null=True,
        blank=True,
        help_text="RF-16: fecha límite para que el autor envíe cambios.",
    )
    notificado = models.BooleanField(default=False)
    emitido_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Veredicto"
        verbose_name_plural = "Veredictos"

    def __str__(self):
        return f"Veredicto {self.resultado} — {self.ponencia}"

    def es_rechazado(self):
        return self.resultado == self.Resultado.RECHAZADO

    def requiere_cambios(self):
        return self.resultado == self.Resultado.ACEPTADO_CON_CAMBIOS