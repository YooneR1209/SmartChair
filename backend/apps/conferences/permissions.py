from rest_framework.permissions import BasePermission
from .models import ConferenciaUsuario


class EsOrganizadorOAdmin(BasePermission):
    """Solo el organizador de la conferencia o un administrador global."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.rol == 'administrador' or user.rol == 'organizador':
            return True
        return obj.organizador == user


class EsParticipanteActivo(BasePermission):
    """El usuario tiene algún rol activo en la conferencia."""

    def has_object_permission(self, request, view, obj):
        return ConferenciaUsuario.objects.filter(
            conferencia=obj,
            usuario=request.user,
            activo=True,
        ).exists()