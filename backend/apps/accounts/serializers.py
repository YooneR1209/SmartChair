from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegistroSerializer(serializers.ModelSerializer):
    password     = serializers.CharField(write_only=True, validators=[validate_password])
    password2    = serializers.CharField(write_only=True, label='Confirmar contraseña')
    institucion  = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model  = User
        fields = ('email', 'nombres', 'apellidos', 'institucion', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Las contraseñas no coinciden.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class PerfilSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = (
            'id', 'email', 'nombres', 'apellidos', 'nombre_completo',
            'institucion', 'biografia', 'foto_perfil', 'rol', 'fecha_registro'
        )
        read_only_fields = ('email', 'rol', 'fecha_registro')


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nuevo  = serializers.CharField(write_only=True, validators=[validate_password])
    password_nuevo2 = serializers.CharField(write_only=True, label='Confirmar nueva contraseña')

    def validate(self, attrs):
        if attrs['password_nuevo'] != attrs['password_nuevo2']:
            raise serializers.ValidationError({'password_nuevo': 'Las contraseñas no coinciden.'})
        return attrs

    def validate_password_actual(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['password_nuevo'])
        user.save()
        return user