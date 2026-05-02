from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('email', 'nombres', 'apellidos', 'rol', 'is_active', 'fecha_registro')
    list_filter   = ('rol', 'is_active', 'is_staff')
    search_fields = ('email', 'nombres', 'apellidos', 'institucion')
    ordering      = ('-fecha_registro',)

    fieldsets = (
        ('Credenciales',   {'fields': ('email', 'password')}),
        ('Información',    {'fields': ('nombres', 'apellidos', 'institucion', 'biografia', 'foto_perfil')}),
        ('Rol y permisos', {'fields': ('rol', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas',         {'fields': ('fecha_registro', 'ultima_sesion')}),
    )
    readonly_fields   = ('fecha_registro', 'ultima_sesion')
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'nombres', 'apellidos', 'rol', 'password1', 'password2'),
        }),
    )