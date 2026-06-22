from rest_framework import serializers
from django.utils.text import slugify
from django.utils import timezone
import secrets
from .models import Conferencia, ConferenciaUsuario, InvitacionRevisor


class ConferenciaListSerializer(serializers.ModelSerializer):
    """Versión resumida para listados."""
    organizador_nombre = serializers.CharField(
        source='organizador.nombre_completo', read_only=True
    )
    esta_abierta = serializers.SerializerMethodField()

    class Meta:
        model  = Conferencia
        fields = (
            'id', 'nombre', 'slug', 'descripcion', 'estado', 'visibilidad',
            'imagen_banner', 'lugar', 'fecha_inicio', 'fecha_fin',
            'fecha_cierre_postulaciones', 'es_de_pago', 'monto_inscripcion',
            'areas_tematicas', 'organizador_nombre', 'esta_abierta',
        )

    def get_esta_abierta(self, obj):
        return obj.esta_abierta_postulacion()


class ConferenciaDetailSerializer(serializers.ModelSerializer):
    """Versión completa para crear, editar y ver detalle."""
    organizador_nombre = serializers.CharField(
        source='organizador.nombre_completo', read_only=True
    )
    esta_abierta = serializers.SerializerMethodField()

    class Meta:
        model  = Conferencia
        fields = '__all__'
        read_only_fields = (
            'slug', 'organizador', 'creado_en', 'actualizado_en',
        )

    def get_esta_abierta(self, obj):
        return obj.esta_abierta_postulacion()

    def validate(self, attrs):
        fecha_inicio = attrs.get('fecha_inicio', getattr(self.instance, 'fecha_inicio', None))
        fecha_fin    = attrs.get('fecha_fin',    getattr(self.instance, 'fecha_fin',    None))
        if fecha_inicio and fecha_fin and fecha_fin < fecha_inicio:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha de fin no puede ser anterior a la de inicio.'}
            )
        ap = attrs.get('fecha_apertura_postulaciones')
        ci = attrs.get('fecha_cierre_postulaciones')
        if ap and ci and ci < ap:
            raise serializers.ValidationError(
                {'fecha_cierre_postulaciones': 'El cierre no puede ser anterior a la apertura.'}
            )
        es_de_pago = attrs.get('es_de_pago', getattr(self.instance, 'es_de_pago', False))
        monto      = attrs.get('monto_inscripcion', getattr(self.instance, 'monto_inscripcion', None))
        if es_de_pago and not monto:
            raise serializers.ValidationError(
                {'monto_inscripcion': 'Debes definir un monto si la conferencia es de pago.'}
            )
        return attrs

    def create(self, validated_data):
        # Generar slug único a partir del nombre
        base_slug = slugify(validated_data['nombre'])
        slug, n   = base_slug, 1
        while Conferencia.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{n}'
            n   += 1
        validated_data['slug']        = slug
        validated_data['organizador'] = self.context['request'].user
        return super().create(validated_data)


class ConferenciaDesdeTemplateSerializer(serializers.Serializer):
    """RF-03: crear una conferencia nueva a partir de una plantilla."""
    nombre      = serializers.CharField(max_length=255)
    fecha_inicio = serializers.DateField()
    fecha_fin    = serializers.DateField()

    def validate(self, attrs):
        if attrs['fecha_fin'] < attrs['fecha_inicio']:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha de fin no puede ser anterior a la de inicio.'}
            )
        return attrs


class ConferenciaUsuarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(
        source='usuario.nombre_completo', read_only=True
    )
    usuario_email  = serializers.CharField(
        source='usuario.email', read_only=True
    )

    class Meta:
        model  = ConferenciaUsuario
        fields = (
            'id', 'usuario', 'usuario_nombre', 'usuario_email',
            'rol', 'categoria_revisor', 'activo', 'invitado_en',
        )
        read_only_fields = ('invitado_en',)


class InvitacionRevisorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = InvitacionRevisor
        fields = ('id', 'email', 'estado', 'expira_en', 'enviada_en')
        read_only_fields = ('estado', 'enviada_en', 'token')

    def create(self, validated_data):
        validated_data['token'] = secrets.token_urlsafe(32)
        return super().create(validated_data)