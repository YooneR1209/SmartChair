from django.db import models

class Evento(models.Model):
    """Modelo base abstracto para Conferencia y EventoDeportivo (fase 2)"""
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    es_publico = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # No crea tabla, solo sirve de base

    # def _str_(self):
    #     return self.nombre

    def __str__(self):
        return self.nombre