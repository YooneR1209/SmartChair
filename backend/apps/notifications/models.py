from django.db import models

# Create your models here.

class EmailLog(models.Model):
    class TipoEmail(models.TextChoices):
        BIENVENIDA = "bienvenida", "Bienvenida"
        ASIGNACION_REVISOR = "asignacion_revisor", "Asignacion de revisor"
        VEREDICTO = "veredicto", "Veredicto emitido"
        FEEDBACK = "feedback", "Feedback anonimo"
        CAMBIO_FECHA = "cambio_fecha", "Cambio de fecha"
        PAPER_REENVIADO = "paper_reenviado", "Paper reenviado a revision"

    class Estado(models.TextChoices):
        ENVIADO = "enviado", "Enviado"
        ERROR = "error", "Error"

    destinatario = models.EmailField(db_index=True)
    tipo = models.CharField(max_length=30, choices=TipoEmail.choices, db_index=True)
    asunto = models.CharField(max_length=255)
    estado = models.CharField(
        max_length=10,
        choices=Estado.choices,
        default=Estado.ENVIADO,
        db_index=True,
    )
    error_msg = models.TextField(blank=True)
    enviado_en = models.DateTimeField(blank=True, null=True, db_index=True)
    creado_en = models.DateTimeField(auto_now_add=True, db_index=True)
    objeto_tipo = models.CharField(max_length=50, blank=True)
    objeto_id = models.PositiveBigIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-creado_en"]
        indexes = [
            models.Index(fields=["objeto_tipo", "objeto_id"]),
            models.Index(fields=["tipo", "estado"]),
        ]
        verbose_name = "Log de email"
        verbose_name_plural = "Logs de emails"

    def __str__(self):
        return f"{self.tipo} -> {self.destinatario} ({self.estado})"