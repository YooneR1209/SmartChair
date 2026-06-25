from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.utils import timezone
from .models import User, VerificacionEmail
from .serializers import RegistroSerializer, PerfilSerializer, CambiarPasswordSerializer
from .services import enviar_correo_verificacion, verificar_por_codigo, verificar_por_token


ROL_VERIFICACION_REQUERIDA = {User.Rol.AUTOR, User.Rol.ORGANIZADOR, User.Rol.SUPERVISOR}
ROL_SIN_VERIFICACION = {User.Rol.ADMINISTRADOR, User.Rol.REVISOR}


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", "").strip().lower()
        user = User.objects.filter(email=email).first()
        if user and not user.is_active and user.rol in ROL_VERIFICACION_REQUERIDA:
            return Response(
                {"detail": "Tu cuenta no está verificada. Revisa tu correo o solicita un nuevo enlace.",
                 "pendiente_verificacion": True, "email": email},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().post(request, *args, **kwargs)


class RegistroView(generics.CreateAPIView):
    """RF-04: Registro de usuarios independiente."""
    queryset         = User.objects.all()
    serializer_class = RegistroSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get("email", "").strip().lower()

        existente = User.objects.filter(email=email).first()
        if existente:
            if not existente.is_active and existente.rol in ROL_VERIFICACION_REQUERIDA:
                try:
                    enviar_correo_verificacion(existente)
                except Exception:
                    pass
                return Response({
                    "detail": "Ya te registraste pero no confirmaste tu correo. Te reenviamos el código.",
                    "pendiente_verificacion": True,
                    "email": email,
                }, status=status.HTTP_200_OK)
            return Response(
                {"detail": "Este correo ya está registrado."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        if user.rol in ROL_VERIFICACION_REQUERIDA:
            user.is_active = False
            user.save(update_fields=["is_active"])
            try:
                enviar_correo_verificacion(user)
            except Exception:
                pass

            resp = {
                "detail": "Registro exitoso. Revisa tu correo para confirmar tu cuenta.",
                "pendiente_verificacion": True,
                "email": user.email,
            }
            return Response(resp, status=status.HTTP_201_CREATED)

        headers = self.get_success_headers(serializer.data)
        return Response({
            "detail": "Registro exitoso.",
            "email": user.email,
        }, status=status.HTTP_201_CREATED, headers=headers)


class ReenviarVerificacionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"detail": "Correo electrónico requerido."},
                            status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "No hay cuenta con este correo."},
                            status=status.HTTP_404_NOT_FOUND)

        if user.is_active:
            return Response({"detail": "Esta cuenta ya está verificada."},
                            status=status.HTTP_400_BAD_REQUEST)

        if user.rol in ROL_SIN_VERIFICACION:
            return Response({"detail": "Esta cuenta no requiere verificación."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            enviar_correo_verificacion(user)
        except Exception:
            return Response(
                {"detail": "Error al enviar el correo. Intenta más tarde."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"detail": "Enlace de verificación reenviado. Revisa tu correo."})


class VerificarEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response(
                {"detail": "Token no proporcionado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario, error = verificar_por_token(token)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": "Correo verificado exitosamente. Ya puedes iniciar sesión.",
            "email": usuario.email,
        })


class VerificarEmailPorCodigoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        codigo = request.data.get("codigo", "").strip()

        if not email or not codigo:
            return Response(
                {"detail": "Correo y código son requeridos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario, error = verificar_por_codigo(email, codigo)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": "Correo verificado exitosamente. Ya puedes iniciar sesión.",
            "email": usuario.email,
        })


class PerfilView(generics.RetrieveUpdateAPIView):
    """Obtener y actualizar el perfil del usuario autenticado."""
    serializer_class   = PerfilSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save()


class CambiarPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Contraseña actualizada correctamente.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Invalida el refresh token para cerrar sesión."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Sesión cerrada correctamente.'})
        except Exception:
            return Response({'detail': 'Token inválido o ya expirado.'}, status=status.HTTP_400_BAD_REQUEST)


class MiPerfilView(APIView):
    """Devuelve los datos del usuario autenticado para el frontend."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = PerfilSerializer(request.user)
        # Actualizar última sesión
        request.user.ultima_sesion = timezone.now()
        request.user.save(update_fields=['ultima_sesion'])
        return Response(serializer.data)