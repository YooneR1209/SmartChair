from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import User
from .serializers import RegistroSerializer, PerfilSerializer, CambiarPasswordSerializer


class RegistroView(generics.CreateAPIView):
    """RF-04: Registro de usuarios independiente."""
    queryset         = User.objects.all()
    serializer_class = RegistroSerializer
    permission_classes = [AllowAny]


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