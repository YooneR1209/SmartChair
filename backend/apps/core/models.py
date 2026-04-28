from django.db import models

class Evento(models.Model):
    nombre = models.CharField(max_length=255)

    class Meta:
        abstract = True