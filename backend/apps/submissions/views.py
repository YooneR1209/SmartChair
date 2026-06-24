from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.conferences.models import Conferencia, ConferenciaUsuario
from .models import Ponencia
from .serializers import (
    PonenciaListSerializer, PonenciaDetailSerializer,
    CambiarEstadoSerializer, ConfirmarPagoSerializer, EnviarCambiosSerializer,
)
from .permissions import EsAutorDeLaPonencia, EsOrganizadorDeLaConferencia, PuedeVerPonencia, PuedeEliminarPonencia
from . import services
from apps.payments.models import Pago


class PonenciaListCreateView(generics.ListCreateAPIView):
    """
    GET  — lista las ponencias de una conferencia según el rol del usuario.
    POST — crea (postula) una nueva ponencia en la conferencia.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_conferencia(self):
        return get_object_or_404(Conferencia, slug=self.kwargs['slug'])

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PonenciaDetailSerializer
        return PonenciaListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['conferencia'] = self.get_conferencia()
        return ctx

    def get_queryset(self):
        user        = self.request.user
        conferencia = self.get_conferencia()
        qs          = Ponencia.objects.filter(conferencia=conferencia).select_related('autor_principal')

        if user.rol in ('administrador', 'organizador'):
            return qs
        if conferencia.organizador == user:
            return qs
        if ConferenciaUsuario.objects.filter(
            conferencia=conferencia, usuario=user,
            rol__in=('organizador', 'revisor'), activo=True,
        ).exists():
            return qs
        # Los autores solo ven sus propias ponencias
        return qs.filter(autor_principal=user)

    def create(self, request, *args, **kwargs):
        conferencia = self.get_conferencia()
        serializer  = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        datos = {**serializer.validated_data, 'archivo': request.FILES.get('archivo')}
        respuestas = request.data.getlist('respuestas', [])

        ponencia = services.postular_ponencia(
            conferencia=conferencia,
            autor=request.user,
            datos=datos,
            respuestas=respuestas if isinstance(respuestas, list) else [],
        )
        return Response(
            PonenciaDetailSerializer(ponencia, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class PonenciaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Ver, editar metadatos o eliminar una ponencia."""
    queryset           = Ponencia.objects.select_related('autor_principal', 'conferencia')
    serializer_class   = PonenciaDetailSerializer
    permission_classes = [IsAuthenticated, PuedeVerPonencia]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['conferencia'] = self.get_object().conferencia
        return ctx

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), PuedeVerPonencia()]
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), PuedeEliminarPonencia()]
        return [IsAuthenticated(), EsAutorDeLaPonencia()]

    def perform_destroy(self, instance):
        # Limpiar pagos relacionados (Pago no tiene FK, usamos referencia_tipo/referencia_id)
        Pago.objects.filter(referencia_tipo='Ponencia', referencia_id=instance.id).delete()
        instance.delete()


class CambiarEstadoView(APIView):
    """
    POST — el organizador o admin cambia el estado de una ponencia.
    Acepta: nuevo_estado y comentario_estado opcional.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ponencia   = get_object_or_404(Ponencia, pk=pk)
        serializer = CambiarEstadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        ponencia = services.cambiar_estado(
            ponencia=ponencia,
            nuevo_estado=d['nuevo_estado'],
            usuario=request.user,
        )

        comentario = d.get('comentario_estado', '').strip()
        if comentario:
            ponencia.comentario_estado = comentario
            ponencia.save(update_fields=['comentario_estado'])

        return Response(PonenciaDetailSerializer(ponencia).data)


class ConfirmarPagoView(APIView):
    """
    POST — RF-10: confirma el pago de una ponencia en conferencia de pago.
    Solo el organizador o admin puede confirmar el pago.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ponencia   = get_object_or_404(Ponencia, pk=pk)
        self.check_object_permissions(request, ponencia)

        serializer = ConfirmarPagoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ponencia = services.confirmar_pago(
            ponencia=ponencia,
            referencia=serializer.validated_data['referencia'],
        )
        return Response(PonenciaDetailSerializer(ponencia).data)

    def get_permissions(self):
        return [IsAuthenticated(), EsOrganizadorDeLaConferencia()]


class EnviarCambiosView(APIView):
    """
    POST — RF-16: el autor reenvía el paper corregido cuando el estado es
    'aceptada_con_cambios'.
    """
    permission_classes = [IsAuthenticated, EsAutorDeLaPonencia]

    def post(self, request, pk):
        ponencia   = get_object_or_404(Ponencia, pk=pk)
        self.check_object_permissions(request, ponencia)

        serializer = EnviarCambiosSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ponencia = services.enviar_cambios(
            ponencia=ponencia,
            archivo=serializer.validated_data['archivo'],
            autor=request.user,
        )
        return Response(PonenciaDetailSerializer(ponencia).data)


class MisPostulacionesView(APIView):
    """
    GET — devuelve todas las ponencias del usuario autenticado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Ponencia.objects.filter(autor_principal=request.user).select_related(
            'conferencia', 'autor_principal'
        )
        data = []
        for p in qs:
            data.append({
                'id': p.id,
                'titulo': p.titulo,
                'resumen': p.resumen,
                'area_tematica': p.area_tematica,
                'estado': p.estado,
                'pago_confirmado': p.pago_confirmado,
                'postulada_en': p.postulada_en,
                'actualizado_en': p.actualizado_en,
                'conferencia_nombre': p.conferencia.nombre,
                'conferencia_slug': p.conferencia.slug,
                'conferencia_es_de_pago': p.conferencia.es_de_pago,
                'archivo_url': p.archivo.url if p.archivo else None,
                'autor_nombre': p.autor_principal.nombre_completo,
            })
        return Response(data)
