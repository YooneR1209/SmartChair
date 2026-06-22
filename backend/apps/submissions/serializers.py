from rest_framework import serializers
from .models import Ponencia, RespuestaFormulario


class RespuestaFormularioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RespuestaFormulario
        fields = ('id', 'nombre_campo', 'valor')


class PonenciaListSerializer(serializers.ModelSerializer):
    """Versión resumida para listados."""
    autor_nombre = serializers.CharField(
        source='autor_principal.nombre_completo', read_only=True
    )

    class Meta:
        model  = Ponencia
        fields = (
            'id', 'titulo', 'area_tematica', 'estado',
            'pago_confirmado', 'postulada_en', 'autor_nombre',
        )


class PonenciaDetailSerializer(serializers.ModelSerializer):
    """Versión completa para crear y ver detalle."""
    autor_nombre = serializers.CharField(
        source='autor_principal.nombre_completo', read_only=True
    )
    respuestas   = RespuestaFormularioSerializer(many=True, read_only=True)

    class Meta:
        model  = Ponencia
        fields = '__all__'
        read_only_fields = (
            'estado', 'autor_principal', 'conferencia',
            'pago_confirmado', 'pago_referencia',
            'postulada_en', 'actualizado_en', 'cambios_enviados_en',
        )

    def _get_conferencia(self):
        return self.context.get('conferencia')

    def validate_archivo(self, value):
        conferencia = self._get_conferencia()
        if conferencia and conferencia.formatos_archivo_permitidos:
            ext = value.name.rsplit('.', 1)[-1].lower()
            if ext not in conferencia.formatos_archivo_permitidos:
                raise serializers.ValidationError(
                    f'Formato .{ext} no permitido. '
                    f'Formatos aceptados: {", ".join(conferencia.formatos_archivo_permitidos)}.'
                )
        return value

    def validate_autores(self, value):
        conferencia = self._get_conferencia()
        if conferencia:
            total = 1 + len(value)
            if total > conferencia.max_autores:
                raise serializers.ValidationError(
                    f'Se superó el máximo de {conferencia.max_autores} autores '
                    f'(autor principal + {conferencia.max_autores - 1} coautores).'
                )
        return value


class CambiarEstadoSerializer(serializers.Serializer):
    """Payload para cambiar el estado de una ponencia."""
    nuevo_estado      = serializers.ChoiceField(choices=Ponencia.Estado.choices)
    comentario_estado = serializers.CharField(required=False, allow_blank=True, default='')


class ConfirmarPagoSerializer(serializers.Serializer):
    """Payload para registrar el pago de una ponencia."""
    referencia = serializers.CharField(
        max_length=100,
        help_text='ID de transacción Stripe o referencia de pago manual.',
    )


class EnviarCambiosSerializer(serializers.Serializer):
    """Payload para reenviar el paper corregido (RF-16)."""
    archivo = serializers.FileField()
