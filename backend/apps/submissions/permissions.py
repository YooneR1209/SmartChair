from rest_framework.permissions import BasePermission
from apps.conferences.models import ConferenciaUsuario


class EsAutorDeLaPonencia(BasePermission):
    """Solo el autor principal de la ponencia puede operar sobre ella."""

    def has_object_permission(self, request, view, obj):
        return obj.autor_principal == request.user


class EsOrganizadorDeLaConferencia(BasePermission):
    """El organizador de la conferencia a la que pertenece la ponencia, o un admin global."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.rol == 'administrador' or user.rol == 'organizador':
            return True
        return obj.conferencia and obj.conferencia.organizador == user


class PuedeVerPonencia(BasePermission):
    """
    Puede ver una ponencia:
    - El autor principal.
    - El organizador de la conferencia.
    - Un administrador global.
    - Un revisor activo en la conferencia (podrá ver las que le sean asignadas).
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.rol == 'administrador' or user.rol == 'organizador':
            return True

        if obj.autor_principal == user:
            return True

        if obj.conferencia and obj.conferencia.organizador == user:
            return True

        if not obj.conferencia:
            return False

        return ConferenciaUsuario.objects.filter(
            conferencia=obj.conferencia,
            usuario=user,
            rol=ConferenciaUsuario.RolEnConferencia.REVISOR,
            activo=True,
        ).exists()
