# apps/reviews/admin.py

from django.contrib import admin
from .models import AsignacionRevisor, Revision, Veredicto


@admin.register(AsignacionRevisor)
class AsignacionRevisorAdmin(admin.ModelAdmin):
    list_display = ("ponencia", "revisor", "es_desempate", "activo", "asignado_en")
    list_filter = ("activo", "es_desempate")
    search_fields = ("revisor__email", "revisor__first_name", "ponencia__titulo")
    readonly_fields = ("asignado_en",)


@admin.register(Revision)
class RevisionAdmin(admin.ModelAdmin):
    list_display = ("asignacion", "veredicto", "estado", "completada_en")
    list_filter = ("estado", "veredicto")
    search_fields = (
        "asignacion__revisor__email",
        "asignacion__ponencia__titulo",
    )
    readonly_fields = ("iniciada_en", "completada_en")


@admin.register(Veredicto)
class VeredictoAdmin(admin.ModelAdmin):
    list_display = ("ponencia", "resultado", "emitido_por", "notificado", "emitido_en")
    list_filter = ("resultado", "notificado")
    search_fields = ("ponencia__titulo", "emitido_por__email")
    readonly_fields = ("emitido_en",)