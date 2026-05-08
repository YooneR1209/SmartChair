from django.contrib import admin
from .models import Ponencia, RespuestaFormulario


class RespuestaFormularioInline(admin.TabularInline):
    model   = RespuestaFormulario
    extra   = 0
    fields  = ('nombre_campo', 'valor')


@admin.register(Ponencia)
class PonenciaAdmin(admin.ModelAdmin):
    list_display   = (
        'titulo', 'autor_principal', 'conferencia',
        'area_tematica', 'estado', 'pago_confirmado', 'postulada_en',
    )
    list_filter    = ('estado', 'pago_confirmado', 'conferencia')
    search_fields  = ('titulo', 'autor_principal__email', 'conferencia__nombre')
    readonly_fields = ('postulada_en', 'actualizado_en', 'cambios_enviados_en')
    inlines        = [RespuestaFormularioInline]

    fieldsets = (
        ('Identificación',  {'fields': ('conferencia', 'autor_principal', 'titulo', 'resumen')}),
        ('Contenido',       {'fields': ('area_tematica', 'autores', 'archivo', 'archivo_revisado')}),
        ('Estado',          {'fields': ('estado', 'comentario_estado')}),
        ('Pago',            {'fields': ('pago_confirmado', 'pago_referencia')}),
        ('Auditoría',       {'fields': ('postulada_en', 'actualizado_en', 'cambios_enviados_en'),
                             'classes': ('collapse',)}),
    )


@admin.register(RespuestaFormulario)
class RespuestaFormularioAdmin(admin.ModelAdmin):
    list_display  = ('ponencia', 'nombre_campo', 'valor')
    search_fields = ('ponencia__titulo', 'nombre_campo')
