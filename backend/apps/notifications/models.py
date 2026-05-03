#from django.db import models

# Create your models here.

from django.db import models

class EmailLog(models.Model):
    class Tipo(models.TextChoices):
        BIENVENIDA = "BIENVENIDA", "Bienvenida"

    class Estado(models.TextChoices):
        ENVIADO = "ENVIADO", "Enviado"
        ERROR = "ERROR", "Error"

    destinatario = models.EmailField(db_index=True)
    tipo = models.CharField(max_length=50, choices=Tipo.choices, db_index=True)
    asunto = models.CharField(max_length=255)
    estado = models.CharField(max_length=20, choices=Estado.choices, db_index=True)
    error_msg = models.TextField(blank=True)
    enviado_en = models.DateTimeField(blank=True, null=True, db_index=True)
    creado_en = models.DateTimeField(auto_now_add=True, db_index=True)
    objeto_tipo = models.CharField(max_length=100, blank=True, null=True)
    objeto_id = models.PositiveBigIntegerField(blank=True, null=True)

    class Meta:
        ordering = ["-creado_en"]
        indexes = [
            models.Index(fields=["objeto_tipo", "objeto_id"]),
            models.Index(fields=["tipo", "estado"]),
        ]
        verbose_name = "log de email"
        verbose_name_plural = "logs de emails"

    def __str__(self):
        return f"{self.tipo} -> {self.destinatario} ({self.estado})"