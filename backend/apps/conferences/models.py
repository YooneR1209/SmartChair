from django.db import models
from django.conf import settings
from apps.core.models import Evento


class Conferencia(Evento):

    class Visibilidad(models.TextChoices):
        PUBLICA  = 'publica',  'Pública'
        PRIVADA  = 'privada',  'Privada'

    class Estado(models.TextChoices):
        BORRADOR    = 'borrador',    'Borrador'
        ABIERTA     = 'abierta',     'Abierta'
        EN_REVISION = 'en_revision', 'En revisión'
        CERRADA     = 'cerrada',     'Cerrada'
        ARCHIVADA   = 'archivada',   'Archivada'

    # ── Configuración general ─────────────────────────────────────────────
    organizador     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='conferencias_organizadas',
        limit_choices_to={'rol__in': ['organizador', 'administrador']},
    )
    visibilidad     = models.CharField(
        max_length=10,
        choices=Visibilidad.choices,
        default=Visibilidad.PUBLICA,
    )
    estado          = models.CharField(
        max_length=15,
        choices=Estado.choices,
        default=Estado.BORRADOR,
    )
    slug            = models.SlugField(
        max_length=255,
        unique=True,
        help_text='Identificador único en la URL. Se genera automáticamente.',
    )
    imagen_banner   = models.ImageField(
        upload_to='conferencias/banners/',
        blank=True,
        null=True,
    )
    sitio_web       = models.URLField(blank=True)
    lugar           = models.CharField(max_length=255, blank=True)
    areas_tematicas = models.JSONField(
        default=list,
        help_text='Lista de áreas temáticas disponibles para las postulaciones.',
    )

    # ── Fechas del proceso ────────────────────────────────────────────────
    fecha_apertura_postulaciones = models.DateField(
        null=True, blank=True,
        help_text='Desde cuándo se pueden enviar postulaciones.',
    )
    fecha_cierre_postulaciones   = models.DateField(
        null=True, blank=True,
        help_text='Hasta cuándo se aceptan postulaciones.',
    )
    fecha_limite_cambios         = models.DateField(
        null=True, blank=True,
        help_text='RF-16: Plazo para que el autor reenvíe el paper con cambios.',
    )

    # ── Configuración de pagos (RF-08, RF-10) ─────────────────────────────
    es_de_pago      = models.BooleanField(default=False)
    monto_inscripcion = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Monto en USD que el ponente debe pagar para postular.',
    )

    # ── Configuración del formulario de postulación (RF-06) ───────────────
    formulario_postulacion = models.JSONField(
        default=list,
        help_text=(
            'Campos personalizados del formulario. '
            'Cada elemento: {"nombre": str, "tipo": str, "requerido": bool, '
            '"opciones": list}'
        ),
    )
    formatos_archivo_permitidos = models.JSONField(
        default=list,
        help_text='Ej: ["pdf", "docx"]. Vacío = sin restricción.',
    )
    max_autores     = models.PositiveSmallIntegerField(
        default=5,
        help_text='Número máximo de autores por ponencia.',
    )

    # ── Configuración de revisión (RF-13, RF-14) ──────────────────────────
    min_revisores   = models.PositiveSmallIntegerField(
        default=2,
        help_text='Mínimo de revisores por ponencia.',
    )
    max_revisores   = models.PositiveSmallIntegerField(
        default=3,
        help_text='Máximo de revisores por ponencia. El 3ro se asigna en caso de empate.',
    )
    asignacion_automatica = models.BooleanField(
        default=False,
        help_text='RF-13: Si True, el sistema asigna revisores por área temática.',
    )

    # ── Rúbrica de evaluación ─────────────────────────────────────────────
    rubrica = models.JSONField(
        default=list,
        help_text=(
            'Criterios de evaluación. '
            'Cada elemento: {"criterio": str, "descripcion": str, "peso": float}'
        ),
    )

    # ── Plantilla (RF-03) ─────────────────────────────────────────────────
    es_plantilla    = models.BooleanField(
        default=False,
        help_text='Si True, esta conferencia puede usarse como plantilla.',
    )
    plantilla_origen = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='conferencias_derivadas',
        help_text='Plantilla a partir de la cual se creó esta conferencia.',
    )

    class Meta:
        verbose_name        = 'Conferencia'
        verbose_name_plural = 'Conferencias'
        ordering            = ['-creado_en']

    def __str__(self):
        return f'{self.nombre} ({self.get_estado_display()})'

    def save(self, *args, **kwargs):
        if not self.slug and self.nombre:
            from django.utils.text import slugify
            base = slugify(self.nombre)[:200]
            slug = base
            n = 1
            while Conferencia.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base}-{n}'
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def esta_abierta_postulacion(self):
        from django.utils import timezone
        hoy = timezone.now().date()
        if not self.fecha_apertura_postulaciones or not self.fecha_cierre_postulaciones:
            return False
        return (
            self.estado == self.Estado.ABIERTA
            and self.fecha_apertura_postulaciones <= hoy <= self.fecha_cierre_postulaciones
        )

    def es_accesible_por(self, user):
        """RF-02: verifica si un usuario puede ver/postular a esta conferencia."""
        if self.visibilidad == self.Visibilidad.PUBLICA:
            return True
        return ConferenciaUsuario.objects.filter(
            conferencia=self, usuario=user
        ).exists()


class ConferenciaUsuario(models.Model):
    """
    Relación muchos a muchos entre usuarios y conferencias con rol específico.
    Un usuario puede ser revisor en una conferencia y autor en otra.
    RF-20: control de acceso por rol dentro de cada conferencia.
    """

    class RolEnConferencia(models.TextChoices):
        ORGANIZADOR = 'organizador', 'Organizador'
        REVISOR     = 'revisor',     'Revisor'
        AUTOR       = 'autor',       'Autor'
        ASISTENTE   = 'asistente',   'Asistente'
        SUPERVISOR  = 'supervisor',  'Supervisor'  # RF-21: diferido

    conferencia = models.ForeignKey(
        Conferencia,
        on_delete=models.CASCADE,
        related_name='participantes',
    )
    usuario     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='participaciones',
    )
    rol         = models.CharField(
        max_length=15,
        choices=RolEnConferencia.choices,
    )
    # Para revisores: categoría asignada por el administrador (RF-12)
    categoria_revisor = models.CharField(max_length=100, blank=True)
    invitado_en       = models.DateTimeField(auto_now_add=True)
    activo            = models.BooleanField(default=True)

    class Meta:
        unique_together     = ('conferencia', 'usuario', 'rol')
        verbose_name        = 'Participante de conferencia'
        verbose_name_plural = 'Participantes de conferencia'

    def __str__(self):
        return f'{self.usuario} — {self.rol} en {self.conferencia}'


class InvitacionRevisor(models.Model):
    """
    RF-11: Invitaciones enviadas a usuarios para unirse como revisores.
    Permite invitar a personas que aún no tienen cuenta.
    """

    class Estado(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        ACEPTADA  = 'aceptada',  'Aceptada'
        RECHAZADA = 'rechazada', 'Rechazada'
        EXPIRADA  = 'expirada',  'Expirada'

    conferencia   = models.ForeignKey(
        Conferencia,
        on_delete=models.CASCADE,
        related_name='invitaciones',
    )
    email         = models.EmailField(
        help_text='Correo al que se envía la invitación.',
    )
    usuario       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='invitaciones_recibidas',
        help_text='Se vincula si el email ya corresponde a un usuario registrado.',
    )
    token         = models.CharField(
        max_length=64,
        unique=True,
        help_text='Token único para aceptar la invitación desde el email.',
    )
    estado        = models.CharField(
        max_length=10,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    enviada_en    = models.DateTimeField(auto_now_add=True)
    respondida_en = models.DateTimeField(null=True, blank=True)
    expira_en     = models.DateField(
        help_text='Fecha límite para aceptar la invitación.',
    )

    class Meta:
        verbose_name        = 'Invitación a revisor'
        verbose_name_plural = 'Invitaciones a revisores'
        ordering            = ['-enviada_en']

    def __str__(self):
        return f'Invitación a {self.email} para {self.conferencia}'

    def esta_vigente(self):
        from django.utils import timezone
        return (
            self.estado == self.Estado.PENDIENTE
            and self.expira_en >= timezone.now().date()
        )