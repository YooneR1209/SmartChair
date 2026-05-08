from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
import secrets

from .models import Conferencia, ConferenciaUsuario, InvitacionRevisor
from .serializers import (
    ConferenciaListSerializer, ConferenciaDetailSerializer,
    ConferenciaDesdeTemplateSerializer, ConferenciaUsuarioSerializer,
    InvitacionRevisorSerializer,
)
from .permissions import EsOrganizadorOAdmin


class ConferenciaListCreateView(generics.ListCreateAPIView):
    """
    GET  — lista conferencias públicas (o todas si es admin/organizador).
    POST — crea una nueva conferencia (organizador o admin).
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ConferenciaDetailSerializer
        return ConferenciaListSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Conferencia.objects.select_related('organizador')

        if user.rol == 'administrador':
            return qs.all()

        # Públicas + privadas donde el usuario tiene rol
        from django.db.models import Q
        return qs.filter(
            Q(visibilidad='publica') |
            Q(participantes__usuario=user, participantes__activo=True)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save()


class ConferenciaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Ver, editar o eliminar una conferencia."""
    queryset           = Conferencia.objects.select_related('organizador')
    permission_classes = [IsAuthenticated]
    lookup_field       = 'slug'

    def get_serializer_class(self):
        return ConferenciaDetailSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAuthenticated(), EsOrganizadorOAdmin()]
        return [IsAuthenticated()]


class ConferenciaDesdeTemplateView(APIView):
    """RF-03: crea una conferencia nueva copiando la configuración de una plantilla."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        plantilla = get_object_or_404(Conferencia, slug=slug, es_plantilla=True)
        serializer = ConferenciaDesdeTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        # Clonar la plantilla
        plantilla.pk               = None
        plantilla.nombre           = d['nombre']
        plantilla.fecha_inicio     = d['fecha_inicio']
        plantilla.fecha_fin        = d['fecha_fin']
        plantilla.estado           = Conferencia.Estado.BORRADOR
        plantilla.es_plantilla     = False
        plantilla.plantilla_origen_id = get_object_or_404(
            Conferencia, slug=slug
        ).id
        plantilla.organizador      = request.user

        # Generar slug único
        from django.utils.text import slugify
        base_slug = slugify(d['nombre'])
        slug_new, n = base_slug, 1
        while Conferencia.objects.filter(slug=slug_new).exists():
            slug_new = f'{base_slug}-{n}'
            n += 1
        plantilla.slug = slug_new
        plantilla.save()

        return Response(
            ConferenciaDetailSerializer(plantilla).data,
            status=status.HTTP_201_CREATED,
        )


class ParticipantesView(generics.ListCreateAPIView):
    """Lista y agrega participantes a una conferencia."""
    serializer_class   = ConferenciaUsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_conferencia(self):
        return get_object_or_404(Conferencia, slug=self.kwargs['slug'])

    def get_queryset(self):
        return ConferenciaUsuario.objects.filter(
            conferencia=self.get_conferencia()
        ).select_related('usuario')

    def perform_create(self, serializer):
        serializer.save(conferencia=self.get_conferencia())


class InvitarRevisorView(generics.CreateAPIView):
    """RF-11: envía una invitación a un email para unirse como revisor."""
    serializer_class   = InvitacionRevisorSerializer
    permission_classes = [IsAuthenticated, EsOrganizadorOAdmin]

    def get_conferencia(self):
        return get_object_or_404(Conferencia, slug=self.kwargs['slug'])

    def perform_create(self, serializer):
        conferencia = self.get_conferencia()
        invitacion  = serializer.save(
            conferencia=conferencia,
            token=secrets.token_urlsafe(32),
        )
        # Vincular con usuario existente si el email ya está registrado
        from apps.accounts.models import User
        try:
            usuario = User.objects.get(email=invitacion.email)
            invitacion.usuario = usuario
            invitacion.save(update_fields=['usuario'])
        except User.DoesNotExist:
            pass
        # Notificar (cuando notifications esté listo)
        # from apps.notifications.services import enviar_invitacion_revisor
        # enviar_invitacion_revisor(invitacion)


class AceptarInvitacionView(APIView):
    """El revisor acepta la invitación usando el token recibido por email."""
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        invitacion = get_object_or_404(InvitacionRevisor, token=token)

        if not invitacion.esta_vigente():
            return Response(
                {'detail': 'La invitación ha expirado o ya fue respondida.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitacion.estado        = InvitacionRevisor.Estado.ACEPTADA
        invitacion.respondida_en = timezone.now()
        invitacion.usuario       = request.user
        invitacion.save()

        # Crear la relación en ConferenciaUsuario
        ConferenciaUsuario.objects.get_or_create(
            conferencia=invitacion.conferencia,
            usuario=request.user,
            rol=ConferenciaUsuario.RolEnConferencia.REVISOR,
            defaults={'activo': True},
        )

        return Response({'detail': 'Invitación aceptada. Ahora eres revisor de esta conferencia.'})