from django.db import models
from django.conf import settings


class Ponencia(models.Model):

    class Estado(models.TextChoices):
        POSTULADA            = 'postulada',            'Postulada'
        EN_REVISION          = 'en_revision',          'En revisión'
        ACEPTADA             = 'aceptada',             'Aceptada'
        RECHAZADA            = 'rechazada',            'Rechazada'
        ACEPTADA_CON_CAMBIOS = 'aceptada_con_cambios', 'Aceptada con cambios'
        CAMBIOS_ENVIADOS     = 'cambios_enviados',     'Cambios enviados'

    # ── Relaciones ────────────────────────────────────────────────────────────
    conferencia = models.ForeignKey(
        'conferences.Conferencia',
        on_delete=models.CASCADE,
        related_name='ponencias',
    )
    autor_principal = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ponencias',
    )

    # ── Datos del trabajo ─────────────────────────────────────────────────────
    titulo        = models.CharField(max_length=300)
    resumen       = models.TextField()
    area_tematica = models.CharField(
        max_length=100,
        help_text='Debe coincidir con alguna de las áreas temáticas de la conferencia.',
    )
    # Lista de coautores: [{"nombre": str, "email": str, "institucion": str}]
    autores       = models.JSONField(
        default=list,
        help_text='Coautores adicionales al autor principal.',
    )

    # ── Archivos ──────────────────────────────────────────────────────────────
    archivo = models.FileField(
        upload_to='ponencias/archivos/',
        help_text='Archivo del trabajo original.',
    )
    archivo_revisado = models.FileField(
        upload_to='ponencias/revisados/',
        null=True,
        blank=True,
        help_text='RF-16: Archivo reenviado por el autor tras pedir cambios.',
    )

    # ── Estado y flujo ────────────────────────────────────────────────────────
    estado = models.CharField(
        max_length=25,
        choices=Estado.choices,
        default=Estado.POSTULADA,
    )
    comentario_estado = models.TextField(
        blank=True,
        help_text='Motivo o feedback al cambiar de estado (visible para el autor).',
    )

    # ── Pago (RF-08, RF-10) ───────────────────────────────────────────────────
    pago_confirmado = models.BooleanField(default=False)
    pago_referencia = models.CharField(
        max_length=100,
        blank=True,
        help_text='Referencia o ID de transacción del pago.',
    )

    # ── Auditoría ─────────────────────────────────────────────────────────────
    postulada_en        = models.DateTimeField(auto_now_add=True)
    actualizado_en      = models.DateTimeField(auto_now=True)
    cambios_enviados_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name        = 'Ponencia'
        verbose_name_plural = 'Ponencias'
        ordering            = ['-postulada_en']
        constraints         = [
            models.UniqueConstraint(
                fields=['autor_principal', 'conferencia'],
                name='unique_autor_por_conferencia',
            ),
        ]

    def __str__(self):
        return f'{self.titulo} ({self.get_estado_display()})'

    @property
    def total_autores(self):
        """Autor principal + coautores del JSON."""
        return 1 + len(self.autores)


class RespuestaFormulario(models.Model):
    """
    RF-06: almacena las respuestas a los campos personalizados definidos
    en Conferencia.formulario_postulacion para cada ponencia.
    """
    ponencia     = models.ForeignKey(
        Ponencia,
        on_delete=models.CASCADE,
        related_name='respuestas',
    )
    nombre_campo = models.CharField(
        max_length=100,
        help_text='Nombre del campo tal como aparece en formulario_postulacion.',
    )
    valor        = models.TextField(blank=True)

    class Meta:
        verbose_name        = 'Respuesta de formulario'
        verbose_name_plural = 'Respuestas de formulario'
        unique_together     = ('ponencia', 'nombre_campo')

    def __str__(self):
        return f'{self.nombre_campo}: {self.valor[:50]}'
