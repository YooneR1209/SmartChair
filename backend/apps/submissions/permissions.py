from rest_framework.permissions import BasePermission


class EsAutorDeLaPonencia(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.autor_principal == request.user


class PuedeEliminarPonencia(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.rol == 'administrador' or user.rol == 'organizador':
            return True
        return obj.autor_principal == user


class PuedeVerPonencia(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.rol == 'administrador' or user.rol == 'organizador':
            return True

        if obj.autor_principal == user:
            return True

        from apps.reviews.models import AsignacionRevisor
        return AsignacionRevisor.objects.filter(
            ponencia=obj, revisor=user, activo=True
        ).exists()
