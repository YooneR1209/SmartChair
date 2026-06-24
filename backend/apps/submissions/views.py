import mimetypes
import os

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.shortcuts import get_object_or_404

from .models import Ponencia
from .serializers import (
    PonenciaListSerializer, PonenciaDetailSerializer,
    CambiarEstadoSerializer, ConfirmarPagoSerializer, EnviarCambiosSerializer,
)
from .permissions import EsAutorDeLaPonencia, PuedeVerPonencia, PuedeEliminarPonencia
from . import services
from apps.payments.models import Pago


class PonenciaListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PonenciaDetailSerializer
        return PonenciaListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Ponencia.objects.select_related('autor_principal')
        if user.rol == 'administrador' or user.rol == 'organizador':
            return qs.all()
        return qs.filter(autor_principal=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        datos = {**serializer.validated_data, 'archivo': request.FILES.get('archivo')}
        respuestas = request.data.getlist('respuestas', [])

        ponencia = services.postular_ponencia(
            autor=request.user,
            datos=datos,
            respuestas=respuestas if isinstance(respuestas, list) else [],
        )
        return Response(
            PonenciaDetailSerializer(ponencia).data,
            status=status.HTTP_201_CREATED,
        )


class PonenciaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Ponencia.objects.select_related('autor_principal')
    serializer_class   = PonenciaDetailSerializer
    permission_classes = [IsAuthenticated, PuedeVerPonencia]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), PuedeVerPonencia()]
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), PuedeEliminarPonencia()]
        return [IsAuthenticated(), EsAutorDeLaPonencia()]

    def perform_destroy(self, instance):
        Pago.objects.filter(referencia_tipo='Ponencia', referencia_id=instance.id).delete()
        instance.delete()


class CambiarEstadoView(APIView):
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
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ponencia   = get_object_or_404(Ponencia, pk=pk)

        serializer = ConfirmarPagoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ponencia = services.confirmar_pago(
            ponencia=ponencia,
            referencia=serializer.validated_data['referencia'],
        )
        return Response(PonenciaDetailSerializer(ponencia).data)


class EnviarCambiosView(APIView):
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


class DescargarArchivoView(APIView):
    permission_classes = [IsAuthenticated, PuedeVerPonencia]

    def get(self, request, pk):
        ponencia = get_object_or_404(Ponencia, pk=pk)
        self.check_object_permissions(request, ponencia)

        if not ponencia.archivo:
            return Response({'error': 'La ponencia no tiene archivo.'}, status=status.HTTP_404_NOT_FOUND)

        archivo_path = ponencia.archivo.path
        if not os.path.exists(archivo_path):
            return Response({'error': 'El archivo no existe en el servidor.'}, status=status.HTTP_404_NOT_FOUND)

        filename = os.path.basename(ponencia.archivo.name)
        response = FileResponse(open(archivo_path, 'rb'), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response


class MisPostulacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Ponencia.objects.filter(autor_principal=request.user).select_related('autor_principal')
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
                'archivo_url': f'/api/conferencias/ponencias/{p.id}/descargar/' if p.archivo else None,
                'autor_nombre': p.autor_principal.nombre_completo,
            })
        return Response(data)
