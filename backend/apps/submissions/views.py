from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.conferences.models import Conferencia
from .models import Ponencia
from .serializers import (
    PonenciaListSerializer, PonenciaDetailSerializer,
    CambiarEstadoSerializer, ConfirmarPagoSerializer, EnviarCambiosSerializer,
)
from .permissions import EsAutorDeLaPonencia, EsOrganizadorDeLaConferencia, PuedeVerPonencia
from . import services


class PonenciaListCreateView(generics.ListCreateAPIView):
    """
    GET  — lista las ponencias de una conferencia según el rol del usuario.
    POST — crea (postula) una nueva ponencia en la conferencia.
    """
    permission_classes = [IsAuthenticated]

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

        if user.rol == 'administrador' or conferencia.organizador == user:
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
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAuthenticated(), EsAutorDeLaPonencia()]
        return [IsAuthenticated(), PuedeVerPonencia()]


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
