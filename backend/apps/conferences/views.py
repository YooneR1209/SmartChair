from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
import stripe
from django.conf import settings
import secrets

from .models import Conferencia, ConferenciaUsuario, InvitacionRevisor
from .serializers import (
    ConferenciaListSerializer, ConferenciaDetailSerializer,
    ConferenciaDesdeTemplateSerializer, ConferenciaUsuarioSerializer,
    InvitacionRevisorSerializer,
)
from .permissions import EsOrganizadorOAdmin
from apps.payments.models import Pago


class ConferenciaListCreateView(generics.ListCreateAPIView):
    """
    GET  — lista conferencias públicas (o todas si es admin/organizador).
    POST — crea una nueva conferencia (organizador o admin).
    """
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ConferenciaDetailSerializer
        return ConferenciaListSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Conferencia.objects.select_related('organizador')

        if user.rol == 'administrador':
            return qs.all()

        # Públicas + privadas donde el usuario tiene rol + las que organiza
        from django.db.models import Q
        return qs.filter(
            Q(visibilidad='publica') |
            Q(participantes__usuario=user, participantes__activo=True) |
            Q(organizador=user)
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        if user.rol not in ('organizador', 'administrador'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Solo organizadores o administradores pueden crear conferencias.')
        serializer.save(organizador=user, estado=Conferencia.Estado.ABIERTA)


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
    pagination_class = None

    def get_conferencia(self):
        return get_object_or_404(Conferencia, slug=self.kwargs['slug'])

    def get_queryset(self):
        return ConferenciaUsuario.objects.filter(
            conferencia=self.get_conferencia()
        ).select_related('usuario')

    def perform_create(self, serializer):
        serializer.save(conferencia=self.get_conferencia())


class RevisoresDisponiblesView(APIView):
    """Lista usuarios disponibles como revisores (rol global revisor o en ConferenciaUsuario)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        conferencia = get_object_or_404(Conferencia, slug=slug)
        if not (request.user.es_administrador or request.user.es_organizador or conferencia.organizador == request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        from apps.accounts.models import User
        # Usuarios con rol global 'revisor'
        revisores_globales = User.objects.filter(rol='revisor', is_active=True)
        # Usuarios en ConferenciaUsuario con rol revisor
        ids_conferencia = ConferenciaUsuario.objects.filter(
            conferencia=conferencia, rol='revisor', activo=True
        ).values_list('usuario_id', flat=True)
        combinados = revisores_globales | User.objects.filter(id__in=ids_conferencia, is_active=True)
        combinados = combinados.distinct()
        data = [{
            'id': u.id,
            'email': u.email,
            'nombres': u.nombres,
            'apellidos': u.apellidos,
            'nombre_completo': u.nombre_completo,
            'rol': u.rol,
        } for u in combinados]
        return Response(data)


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
            from apps.notifications.services import crear_notificacion
            crear_notificacion(
                usuario=usuario,
                tipo='invitacion_revisor',
                titulo=f'Invitación como revisor - {conferencia.nombre}',
                mensaje=f'Has sido invitado como revisor para la conferencia "{conferencia.nombre}".',
                link=f'/invitacion/{invitacion.token}',
            )
        except User.DoesNotExist:
            pass
        from apps.notifications.services import enviar_invitacion_revisor
        enviar_invitacion_revisor(invitacion)


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


class InscribirView(APIView):
    """Inscribe al usuario autenticado en la conferencia con el rol indicado.
    Si la conferencia es de pago, crea un PaymentIntent de Stripe."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        conferencia = get_object_or_404(Conferencia, slug=slug)

        if conferencia.estado != Conferencia.Estado.ABIERTA:
            return Response(
                {'detail': 'La conferencia no está abierta para inscripciones.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rol = request.data.get('rol', ConferenciaUsuario.RolEnConferencia.ASISTENTE)
        roles_validos = [r.value for r in ConferenciaUsuario.RolEnConferencia]
        if rol not in roles_validos:
            return Response(
                {'detail': f'Rol inválido. Debe ser uno de: {", ".join(roles_validos)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = request.user
        inscripcion, created = ConferenciaUsuario.objects.get_or_create(
            conferencia=conferencia,
            usuario=usuario,
            rol=rol,
            defaults={'activo': True},
        )

        if not created:
            return Response(
                {'detail': 'Ya estás inscrito en esta conferencia con ese rol.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = {
            'success': True,
            'detail': 'Inscripción exitosa.',
            'rol': rol,
        }

        if conferencia.es_de_pago and conferencia.monto_inscripcion:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            monto_centavos = int(Decimal(str(conferencia.monto_inscripcion)) * 100)
            try:
                intent = stripe.PaymentIntent.create(
                    amount=monto_centavos,
                    currency='usd',
                    metadata={
                        'usuario_id': str(usuario.id),
                        'conferencia_slug': slug,
                        'referencia_tipo': 'Inscripcion',
                        'inscripcion_id': str(inscripcion.id),
                    },
                )
                pago = Pago.objects.create(
                    usuario=usuario,
                    stripe_payment_intent_id=intent['id'],
                    monto=conferencia.monto_inscripcion,
                    moneda='usd',
                    referencia_tipo='Inscripcion',
                    referencia_id=inscripcion.id,
                )
                result['client_secret'] = intent['client_secret']
                result['pago_id'] = pago.id
                result['monto'] = str(conferencia.monto_inscripcion)
                result['requires_payment'] = True
            except stripe.error.StripeError:
                inscripcion.delete()
                return Response(
                    {'detail': 'Error al procesar el pago. Intenta de nuevo.'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
        else:
            result['requires_payment'] = False

        return Response(result, status=status.HTTP_201_CREATED)