# apps/reviews/serializers.py

from rest_framework import serializers
from .models import AsignacionRevisor, Revision, Veredicto


# ─────────────────────────────────────────────
#  Serializers para el REVISOR
# ─────────────────────────────────────────────

class RevisionParaRevisorSerializer(serializers.ModelSerializer):
    """
    RF-17: Vista del revisor — ve el contenido de la ponencia
    pero NUNCA los datos del autor (pares ciegos).
    """
    # Datos de la ponencia (sin autor)
    titulo = serializers.CharField(
        source="asignacion.ponencia.titulo", read_only=True
    )
    resumen = serializers.CharField(
        source="asignacion.ponencia.resumen", read_only=True
    )
    area_tematica = serializers.CharField(
        source="asignacion.ponencia.area_tematica", read_only=True
    )
    archivo = serializers.SerializerMethodField()

    def get_archivo(self, obj):
        ponencia = obj.asignacion.ponencia
        if ponencia and ponencia.archivo:
            return f"/api/conferencias/ponencias/{ponencia.id}/descargar/"
        return None
    # autor, autor_email, autores_adicionales → NUNCA se exponen aquí

    class Meta:
        model = Revision
        fields = (
            "id",
            "titulo",
            "resumen",
            "area_tematica",
            "archivo",
            "respuestas_rubrica",
            "comentario_autor",       # el revisor ve su propio comentario
            "comentario_privado",     # solo lo ve el revisor (y el organizador)
            "veredicto",
            "estado",
            "iniciada_en",
            "completada_en",
        )
        read_only_fields = (
            "id", "titulo", "resumen", "area_tematica",
            "archivo", "estado", "iniciada_en", "completada_en",
        )


class CompletarRevisionSerializer(serializers.Serializer):
    """Payload que envía el revisor para completar su evaluación (RF-15)."""
    veredicto = serializers.ChoiceField(choices=Revision.Veredicto.choices)
    comentario_autor = serializers.CharField(allow_blank=True, default="")
    comentario_privado = serializers.CharField(allow_blank=True, default="")
    respuestas_rubrica = serializers.DictField(
        child=serializers.CharField(), default=dict
    )


class MiAsignacionSerializer(serializers.ModelSerializer):
    """Lista las asignaciones activas de un revisor."""
    ponencia_id = serializers.IntegerField(source="ponencia.id", read_only=True)
    titulo = serializers.CharField(source="ponencia.titulo", read_only=True)
    resumen = serializers.CharField(source="ponencia.resumen", read_only=True)
    area_tematica = serializers.CharField(source="ponencia.area_tematica", read_only=True)
    conferencia = serializers.SerializerMethodField()

    def get_conferencia(self, obj):
        return None
    revision_id = serializers.SerializerMethodField()
    estado_revision = serializers.SerializerMethodField()
    veredicto = serializers.SerializerMethodField()
    comentario_autor = serializers.SerializerMethodField()
    comentario_privado = serializers.SerializerMethodField()
    archivo = serializers.SerializerMethodField()

    class Meta:
        model = AsignacionRevisor
        fields = (
            "id",
            "ponencia_id",
            "revision_id",
            "titulo",
            "resumen",
            "area_tematica",
            "conferencia",
            "archivo",
            "es_desempate",
            "asignado_en",
            "estado_revision",
            "veredicto",
            "comentario_autor",
            "comentario_privado",
        )

    def get_revision(self, obj):
        if hasattr(obj, "revision"):
            return obj.revision
        return None

    def get_revision_id(self, obj):
        rev = self.get_revision(obj)
        return rev.id if rev else None

    def get_estado_revision(self, obj):
        rev = self.get_revision(obj)
        return rev.estado if rev else None

    def get_veredicto(self, obj):
        rev = self.get_revision(obj)
        return rev.veredicto if rev else None

    def get_comentario_autor(self, obj):
        rev = self.get_revision(obj)
        return rev.comentario_autor if rev else None

    def get_comentario_privado(self, obj):
        rev = self.get_revision(obj)
        return rev.comentario_privado if rev else None

    def get_archivo(self, obj):
        rev = self.get_revision(obj)
        if rev and rev.asignacion.ponencia.archivo:
            return f"/api/conferencias/ponencias/{rev.asignacion.ponencia_id}/descargar/"
        return None


# ─────────────────────────────────────────────
#  Serializers para el ORGANIZADOR
# ─────────────────────────────────────────────

class AsignarRevisorSerializer(serializers.Serializer):
    """Payload para asignación manual de revisor (RF-13)."""
    ponencia_id = serializers.IntegerField()
    revisor_id = serializers.IntegerField()


class RevisionParaOrganizadorSerializer(serializers.ModelSerializer):
    """
    Vista del organizador sobre las revisiones de una ponencia.
    Puede ver comentario_privado y el nombre del revisor.
    """
    revisor_nombre = serializers.CharField(
        source="asignacion.revisor.get_full_name", read_only=True
    )
    revisor_email = serializers.EmailField(
        source="asignacion.revisor.email", read_only=True
    )

    class Meta:
        model = Revision
        fields = (
            "id",
            "revisor_nombre",
            "revisor_email",
            "respuestas_rubrica",
            "comentario_autor",
            "comentario_privado",
            "veredicto",
            "estado",
            "iniciada_en",
            "completada_en",
        )


class EmitirVeredictoManualSerializer(serializers.Serializer):
    """Payload para que el organizador emita un veredicto manual (RF-16)."""
    resultado = serializers.ChoiceField(choices=Veredicto.Resultado.choices)
    resumen_para_autor = serializers.CharField(allow_blank=True, default="")
    plazo_cambios = serializers.DateField(required=False, allow_null=True)


# ─────────────────────────────────────────────
#  Serializers para el AUTOR
# ─────────────────────────────────────────────

class VeredictoParaAutorSerializer(serializers.ModelSerializer):
    """
    RF-17/18: Vista del autor — ve el resultado y el feedback anónimo
    pero NUNCA quién revisó ni el comentario_privado.
    """
    class Meta:
        model = Veredicto
        fields = (
            "resultado",
            "resumen_para_autor",
            "plazo_cambios",
            "emitido_en",
        )
        # emitido_por → NUNCA expuesto al autor