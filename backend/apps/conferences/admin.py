from django.contrib import admin
from .models import Conferencia, ConferenciaUsuario, InvitacionRevisor


class ConferenciaUsuarioInline(admin.TabularInline):
    model   = ConferenciaUsuario
    extra   = 0
    fields  = ('usuario', 'rol', 'categoria_revisor', 'activo')


class InvitacionInline(admin.TabularInline):
    model      = InvitacionRevisor
    extra      = 0
    fields     = ('email', 'estado', 'expira_en', 'enviada_en')
    readonly_fields = ('enviada_en',)


@admin.register(Conferencia)
class ConferenciaAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'organizador', 'estado', 'visibilidad',
                     'es_de_pago', 'fecha_inicio', 'fecha_fin')
    list_filter   = ('estado', 'visibilidad', 'es_de_pago', 'es_plantilla')
    search_fields = ('nombre', 'descripcion', 'organizador__email')
    prepopulated_fields = {'slug': ('nombre',)}
    readonly_fields     = ('creado_en', 'actualizado_en')
    inlines             = [ConferenciaUsuarioInline, InvitacionInline]

    fieldsets = (
        ('General',         {'fields': ('nombre', 'slug', 'descripcion', 'organizador',
                                        'estado', 'visibilidad', 'imagen_banner',
                                        'sitio_web', 'lugar', 'areas_tematicas')}),
        ('Fechas',          {'fields': ('fecha_inicio', 'fecha_fin',
                                        'fecha_apertura_postulaciones',
                                        'fecha_cierre_postulaciones',
                                        'fecha_limite_cambios')}),
        ('Pagos',           {'fields': ('es_de_pago', 'monto_inscripcion')}),
        ('Postulación',     {'fields': ('formulario_postulacion',
                                        'formatos_archivo_permitidos', 'max_autores')}),
        ('Revisión',        {'fields': ('min_revisores', 'max_revisores',
                                        'asignacion_automatica', 'rubrica')}),
        ('Plantilla',       {'fields': ('es_plantilla', 'plantilla_origen')}),
        ('Auditoría',       {'fields': ('creado_en', 'actualizado_en'),
                             'classes': ('collapse',)}),
    )


@admin.register(ConferenciaUsuario)
class ConferenciaUsuarioAdmin(admin.ModelAdmin):
    list_display  = ('usuario', 'conferencia', 'rol', 'activo', 'invitado_en')
    list_filter   = ('rol', 'activo')
    search_fields = ('usuario__email', 'conferencia__nombre')


@admin.register(InvitacionRevisor)
class InvitacionRevisorAdmin(admin.ModelAdmin):
    list_display  = ('email', 'conferencia', 'estado', 'enviada_en', 'expira_en')
    list_filter   = ('estado',)
    search_fields = ('email', 'conferencia__nombre')
    readonly_fields = ('token', 'enviada_en')