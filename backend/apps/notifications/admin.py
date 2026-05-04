from django.contrib import admin

from .models import EmailLog

# Register your models here.
@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = (
        "destinatario",
        "tipo",
        "asunto",
        "estado",
        "objeto_tipo",
        "objeto_id",
        "enviado_en",
        "creado_en",
    )
    list_filter = ("tipo", "estado", "creado_en", "enviado_en")
    search_fields = ("destinatario", "asunto", "error_msg", "objeto_tipo")
    readonly_fields = (
        "destinatario",
        "tipo",
        "asunto",
        "estado",
        "error_msg",
        "enviado_en",
        "creado_en",
        "objeto_tipo",
        "objeto_id",
    )
    date_hierarchy = "creado_en"
    ordering = ("-creado_en",)

    def has_add_permission(self, request):
        return False