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
    completar_revision,
    emitir_veredicto_final,
)
from apps.submissions.models import Ponencia


# ──────────────────────────────────────────────────────────────
#  Helpers de permisos
# ──────────────────────────────────────────────────────────────

def _es_organizador(user):
    return user.es_administrador or user.es_organizador


def _es_revisor_de(user, revision):
    return revision.asignacion.revisor == user


# ──────────────────────────────────────────────────────────────
#  POST /api/reviews/asignar/
# ──────────────────────────────────────────────────────────────

class AsignarAutomaticoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ponencia_id):
        ponencia = get_object_or_404(Ponencia, pk=ponencia_id)

        if not _es_organizador(request.user):
            return Response(
                {"detail": "Solo el organizador puede usar la asignación automática."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from .services import asignar_revisores_automatico
        try:
            total = asignar_revisores_automatico(ponencia)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": f"Se asignaron {total} revisores automáticamente."},
            status=status.HTTP_200_OK,
        )


class AsignarRevisorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AsignarRevisorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ponencia = get_object_or_404(
            Ponencia, pk=serializer.validated_data["ponencia_id"]
        )

        if not _es_organizador(request.user):
            return Response(
                {"detail": "Solo el organizador puede asignar revisores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()
        revisor = get_object_or_404(User, pk=serializer.validated_data["revisor_id"])

        try:
            asignacion = asignar_revisor(ponencia, revisor, usuario=request.user)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": "Revisor asignado correctamente.", "asignacion_id": asignacion.id},
            status=status.HTTP_201_CREATED,
        )


# ──────────────────────────────────────────────────────────────
#  GET /api/reviews/mis-asignaciones/
# ──────────────────────────────────────────────────────────────

class MisAsignacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        asignaciones = AsignacionRevisor.objects.filter(
            revisor=request.user, activo=True
        ).select_related("ponencia")

        serializer = MiAsignacionSerializer(asignaciones, many=True)
        return Response(serializer.data)


# ──────────────────────────────────────────────────────────────
#  GET /api/reviews/<revision_id>/
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
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            RevisionParaRevisorSerializer(revision).data,
            status=status.HTTP_200_OK,
        )


# ──────────────────────────────────────────────────────────────
#  GET /api/reviews/ponencia/<ponencia_id>/
# ──────────────────────────────────────────────────────────────

class RevisionesPonenciaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ponencia_id):
        ponencia = get_object_or_404(Ponencia, pk=ponencia_id)

        if not _es_organizador(request.user):
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
#  GET  /api/reviews/veredicto/<ponencia_id>/
# ──────────────────────────────────────────────────────────────

class VeredictoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ponencia_id):
        ponencia = get_object_or_404(Ponencia, pk=ponencia_id)

        es_organizador = _es_organizador(request.user)
        es_autor = ponencia.autor_principal == request.user

        if not (es_organizador or es_autor):
            return Response(
                {"detail": "No tienes permiso para ver este veredicto."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            veredicto = Veredicto.objects.get(ponencia=ponencia)
            serializer = VeredictoParaAutorSerializer(veredicto)
            return Response({
                "veredicto_final": serializer.data,
                "estado_ponencia": ponencia.estado,
            })
        except Veredicto.DoesNotExist:
            pass

        asignaciones = AsignacionRevisor.objects.filter(ponencia=ponencia, activo=True)
        total = asignaciones.count()

        revisiones_completadas = []
        for asg in asignaciones:
            if hasattr(asg, "revision") and asg.revision.esta_completa():
                revisiones_completadas.append({
                    "veredicto": asg.revision.veredicto,
                    "comentario_autor": asg.revision.comentario_autor,
                })

        return Response({
            "veredicto_final": None,
            "estado_ponencia": ponencia.estado,
            "total_revisiones": total,
            "completadas": len(revisiones_completadas),
            "revisiones_completadas": revisiones_completadas,
        })

    def post(self, request, ponencia_id):
        ponencia = get_object_or_404(Ponencia, pk=ponencia_id)

        if not _es_organizador(request.user):
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
            if data.get("resumen_para_autor"):
                veredicto.resumen_para_autor = data["resumen_para_autor"]
            if data.get("plazo_cambios"):
                veredicto.plazo_cambios = data["plazo_cambios"]
            veredicto.save(update_fields=["resumen_para_autor", "plazo_cambios"])
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            VeredictoParaAutorSerializer(veredicto).data,
            status=status.HTTP_201_CREATED,
        )
