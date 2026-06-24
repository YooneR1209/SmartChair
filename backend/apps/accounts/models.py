from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', User.Rol.ADMINISTRADOR)

        if not extra_fields.get('is_staff'):
            raise ValueError('El superusuario debe tener is_staff=True')
        if not extra_fields.get('is_superuser'):
            raise ValueError('El superusuario debe tener is_superuser=True')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):

    class Rol(models.TextChoices):
        ADMINISTRADOR = 'administrador', 'Administrador'
        ORGANIZADOR   = 'organizador',   'Organizador'
        REVISOR       = 'revisor',        'Revisor'
        AUTOR         = 'autor',          'Autor'
        SUPERVISOR    = 'supervisor',     'Supervisor'  # RF-21: diferido, sin funcionalidades

    # Campos de identidad
    email          = models.EmailField(unique=True, verbose_name='Correo electrónico')
    nombres        = models.CharField(max_length=100)
    apellidos      = models.CharField(max_length=100)
    institucion    = models.CharField(max_length=255, blank=True)
    biografia      = models.TextField(blank=True)
    foto_perfil    = models.ImageField(upload_to='perfiles/', blank=True, null=True)

    # Rol global del usuario en la plataforma
    # El rol dentro de una conferencia específica se maneja en ConferenciaUsuario
    rol            = models.CharField(
        max_length=20,
        choices=Rol.choices,
        default=Rol.AUTOR,
        verbose_name='Rol global'
    )

    # Campos de control de Django
    is_active      = models.BooleanField(default=True)
    is_staff       = models.BooleanField(default=False)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    ultima_sesion  = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['nombres', 'apellidos']

    objects = UserManager()

    class Meta:
        verbose_name        = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering            = ['-fecha_registro']

    def __str__(self):
        return f'{self.nombres} {self.apellidos} <{self.email}>'

    @property
    def nombre_completo(self):
        return f'{self.nombres} {self.apellidos}'

    @property
    def es_administrador(self):
        return self.rol == self.Rol.ADMINISTRADOR

    @property
    def es_organizador(self):
        return self.rol == self.Rol.ORGANIZADOR


class VerificacionEmail(models.Model):
    usuario = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='verificacion'
    )
    token = models.CharField(max_length=64, unique=True)
    codigo = models.CharField(max_length=6)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Verificación de email'
        verbose_name_plural = 'Verificaciones de email'

    def __str__(self):
        return f'{self.usuario.email} - {self.creado_en}'