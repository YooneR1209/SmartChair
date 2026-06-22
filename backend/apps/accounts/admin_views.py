from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from apps.conferences.models import Conferencia
from apps.submissions.models import Ponencia
from apps.payments.models import Pago
from .models import User


def es_admin(user):
    return user.is_authenticated and user.rol == 'administrador'


class AdminUsuariosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (es_admin(request.user) or request.user.es_organizador):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        search = request.query_params.get('search', '')
        usuarios = User.objects.all()
        if search:
            usuarios = usuarios.filter(
                Q(nombres__icontains=search) |
                Q(apellidos__icontains=search) |
                Q(email__icontains=search)
            )
        data = []
        for u in usuarios:
            data.append({
                'id': u.id,
                'email': u.email,
                'nombres': u.nombres,
                'apellidos': u.apellidos,
                'nombre_completo': u.nombre_completo,
                'institucion': u.institucion,
                'rol': u.rol,
                'is_active': u.is_active,
                'fecha_registro': u.fecha_registro.isoformat() if u.fecha_registro else None,
                'ultima_sesion': u.ultima_sesion.isoformat() if u.ultima_sesion else None,
            })
        return Response(data)


class AdminCambiarRolView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, usuario_id):
        if not es_admin(request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        try:
            usuario = User.objects.get(id=usuario_id)
        except User.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        nuevo_rol = request.data.get('rol', '').strip().lower()
        roles_validos = ['administrador', 'organizador', 'revisor', 'autor', 'supervisor']
        if nuevo_rol not in roles_validos:
            return Response({'detail': f'Rol inválido. Roles: {", ".join(roles_validos)}'}, status=status.HTTP_400_BAD_REQUEST)
        usuario.rol = nuevo_rol
        usuario.save(update_fields=['rol'])
        return Response({'detail': f'Rol actualizado a {nuevo_rol}.'})


class AdminToggleEstadoView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, usuario_id):
        if not es_admin(request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        try:
            usuario = User.objects.get(id=usuario_id)
        except User.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        if usuario == request.user:
            return Response({'detail': 'No puedes desactivarte a ti mismo.'}, status=status.HTTP_400_BAD_REQUEST)
        usuario.is_active = not usuario.is_active
        usuario.save(update_fields=['is_active'])
        estado = 'activado' if usuario.is_active else 'desactivado'
        return Response({'detail': f'Usuario {estado} correctamente.', 'is_active': usuario.is_active})


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not es_admin(request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        total_usuarios = User.objects.count()
        usuarios_activos = User.objects.filter(is_active=True).count()
        total_conferencias = Conferencia.objects.count()
        total_ponencias = Ponencia.objects.count()
        total_pagos = Pago.objects.count()
        pagos_completados = Pago.objects.filter(estado='completado').count()
        roles_count = User.objects.values('rol').annotate(count=Count('id')).order_by('rol')
        return Response({
            'total_usuarios': total_usuarios,
            'usuarios_activos': usuarios_activos,
            'total_conferencias': total_conferencias,
            'total_ponencias': total_ponencias,
            'total_pagos': total_pagos,
            'pagos_completados': pagos_completados,
            'roles_count': {r['rol']: r['count'] for r in roles_count},
        })


class AdminPostulacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not es_admin(request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        ponencias = Ponencia.objects.select_related('conferencia', 'autor_principal').all()
        conferencia = request.query_params.get('conferencia')
        estado = request.query_params.get('estado')
        area = request.query_params.get('area')
        if conferencia:
            ponencias = ponencias.filter(conferencia_id=conferencia)
        if estado:
            ponencias = ponencias.filter(estado=estado)
        if area:
            ponencias = ponencias.filter(area_tematica__icontains=area)
        data = []
        for p in ponencias:
            data.append({
                'id': p.id,
                'titulo': p.titulo,
                'conferencia': p.conferencia.nombre,
                'conferencia_slug': p.conferencia.slug,
                'autor': p.autor_principal.nombre_completo,
                'autor_email': p.autor_principal.email,
                'area_tematica': p.area_tematica,
                'estado': p.estado,
                'pago_confirmado': p.pago_confirmado,
                'postulada_en': p.postulada_en.isoformat() if p.postulada_en else None,
            })
        return Response(data)


class AdminPagosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not es_admin(request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        pagos = Pago.objects.select_related('usuario').all()
        data = []
        for p in pagos:
            data.append({
                'id': p.id,
                'usuario': p.usuario.nombre_completo,
                'usuario_email': p.usuario.email,
                'monto': str(p.monto),
                'moneda': p.moneda,
                'estado': p.estado,
                'referencia_tipo': p.referencia_tipo,
                'referencia_id': p.referencia_id,
                'creado_en': p.creado_en.isoformat() if p.creado_en else None,
            })
        return Response(data)
