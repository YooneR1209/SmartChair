# apps/reviews/views.py

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AsignacionRevisor, Revision, Veredicto
from .serializers import (
    AsignarRevisorSerializer,
    CompletarRevisionSerializer,
    EmitirVeredictoManualSerializer,
    MiAsignacionSerializer,
    RevisionParaOrganizadorSerializer,
    RevisionParaRevisorSerializer,
    VeredictoParaAutorSerializer,
)
from .services import (
    asignar_revisor,
    asignar_revisores_automatico,
    completar_revision,
    emitir_veredicto_final,
)
from apps.submissions.models import Ponencia


# ──────────────────────────────────────────────────────────────
#  Helpers de permisos
# ──────────────────────────────────────────────────────────────

def _es_organizador(user, conferencia):
    return conferencia.organizador == user


def _es_revisor_de(user, revision):
    return revision.asignacion.revisor == user


# ──────────────────────────────────────────────────────────────
#  POST /api/reviews/asignar/
#  Asignación manual de revisor (RF-13) — solo organizador
# ──────────────────────────────────────────────────────────────

class AsignarRevisorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AsignarRevisorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ponencia = get_object_or_404(
            Ponencia, pk=serializer.validated_data["ponencia_id"]
        )

        if not _es_organizador(request.user, ponencia.conferencia):
            return Response(
                {"detail": "Solo el organizador puede asignar revisores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()
        revisor = get_object_or_404(User, pk=serializer.validated_data["revisor_id"])

        try:
            asignacion = asignar_revisor(ponencia, revisor)
        except ValidationError as e:
            return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": "Revisor asignado correctamente.", "asignacion_id": asignacion.id},
            status=status.HTTP_201_CREATED,
        )


# ──────────────────────────────────────────────────────────────
#  POST /api/reviews/asignar-automatico/<ponencia_id>/
#  Asignación automática por área temática (RF-13) — solo organizador
# ──────────────────────────────────────────────────────────────

class AsignarAutomaticoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ponencia_id):
        ponencia = get_object_or_404(Ponencia, pk=ponencia_id)

        if not _es_organizador(request.user, ponencia.conferencia):
            return Response(
                {"detail": "Solo el organizador puede usar la asignación automática."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            total = asignar_revisores_automatico(ponencia)
        except ValidationError as e:
            return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": f"Se asignaron {total} revisores automáticamente."},
            status=status.HTTP_200_OK,
        )


# ──────────────────────────────────────────────────────────────
#  GET /api/reviews/mis-asignaciones/
#  Lista las ponencias asignadas al revisor autenticado
# ──────────────────────────────────────────────────────────────

class MisAsignacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        asignaciones = AsignacionRevisor.objects.filter(
            revisor=request.user, activo=True
        ).select_related("ponencia", "ponencia.conferencia")

        serializer = MiAsignacionSerializer(asignaciones, many=True)
        return Response(serializer.data)


# ──────────────────────────────────────────────────────────────
#  GET /api/reviews/<revision_id>/
#  Detalle de una revisión (solo el revisor asignado)
# ──────────────────────────────────────────────────────────────

class DetalleRevisionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, revision_id):
        revision = get_object_or_404(
            Revision.objects.select_related(
                "asignacion__ponencia", "asignacion__revisor"
            ),
            pk=revision_id,
        )

        if not _es_revisor_de(request.user, revision):
            return Response(
                {"detail": "No tienes permiso para ver esta revisión."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = RevisionParaRevisorSerializer(revision)
        return Response(serializer.data)


# ──────────────────────────────────────────────────────────────
#  PUT /api/reviews/<revision_id>/completar/
#  El revisor envía su evaluación (RF-15)
# ──────────────────────────────────────────────────────────────

class CompletarRevisionView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, revision_id):
        revision = get_object_or_404(
            Revision.objects.select_related("asignacion__revisor"),
            pk=revision_id,
        )

        if not _es_revisor_de(request.user, revision):
            return Response(
                {"detail": "No tienes permiso para completar esta revisión."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CompletarRevisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            revision = completar_revision(
                revision=revision,
                veredicto=data["veredicto"],
                comentario_autor=data["comentario_autor"],
                comentario_privado=data["comentario_privado"],
                respuestas_rubrica=data["respuestas_rubrica"],
            )
        except ValidationError as e:
            return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            RevisionParaRevisorSerializer(revision).data,
            status=status.HTTP_200_OK,
        )


# ──────────────────────────────────────────────────────────────
#  GET /api/reviews/ponencia/<ponencia_id>/
#  Lista revisiones de una ponencia (solo organizador) RF-17
# ──────────────────────────────────────────────────────────────

class RevisionesPonenciaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ponencia_id):
        ponencia = get_object_or_404(Ponencia, pk=ponencia_id)

        if not _es_organizador(request.user, ponencia.conferencia):
            return Response(
                {"detail": "Solo el organizador puede ver todas las revisiones."},
                status=status.HTTP_403_FORBIDDEN,
            )

        revisiones = Revision.objects.filter(
            asignacion__ponencia=ponencia,
            asignacion__activo=True,
        ).select_related("asignacion__revisor")

        serializer = RevisionParaOrganizadorSerializer(revisiones, many=True)
        return Response(serializer.data)


# ──────────────────────────────────────────────────────────────
#  POST /api/reviews/veredicto/<ponencia_id>/
#  Organizador emite veredicto final manual (RF-16)
#
#  GET  /api/reviews/veredicto/<ponencia_id>/
#  Ver el veredicto de una ponencia (autor o organizador)
# ──────────────────────────────────────────────────────────────

class VeredictoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ponencia_id):
        ponencia = get_object_or_404(Ponencia, pk=ponencia_id)
        veredicto = get_object_or_404(Veredicto, ponencia=ponencia)

        es_organizador = _es_organizador(request.user, ponencia.conferencia)
        es_autor = ponencia.autor == request.user

        if not (es_organizador or es_autor):
            return Response(
                {"detail": "No tienes permiso para ver este veredicto."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # El autor solo recibe la versión anónima (RF-17/18)
        serializer = VeredictoParaAutorSerializer(veredicto)
        return Response(serializer.data)

    def post(self, request, ponencia_id):
        """Organizador emite veredicto manual cuando lo requiere (RF-16)."""
        ponencia = get_object_or_404(Ponencia, pk=ponencia_id)

        if not _es_organizador(request.user, ponencia.conferencia):
            return Response(
                {"detail": "Solo el organizador puede emitir el veredicto."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if hasattr(ponencia, "veredicto"):
            return Response(
                {"detail": "Esta ponencia ya tiene un veredicto emitido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = EmitirVeredictoManualSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        revisiones_completadas = list(
            Revision.objects.filter(
                asignacion__ponencia=ponencia,
                asignacion__activo=True,
                estado=Revision.Estado.COMPLETADA,
            )
        )

        try:
            veredicto = emitir_veredicto_final(
                ponencia, data["resultado"], revisiones_completadas
            )
            # Aplicar campos extra del organizador si los envió
            if data.get("resumen_para_autor"):
                veredicto.resumen_para_autor = data["resumen_para_autor"]
            if data.get("plazo_cambios"):
                veredicto.plazo_cambios = data["plazo_cambios"]
            veredicto.save(update_fields=["resumen_para_autor", "plazo_cambios"])
        except ValidationError as e:
            return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            VeredictoParaAutorSerializer(veredicto).data,
            status=status.HTTP_201_CREATED,
        )