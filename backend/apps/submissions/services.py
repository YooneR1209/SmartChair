from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied

from .models import Ponencia, RespuestaFormulario
from apps.reviews.models import Revision


# Transiciones de estado permitidas para el organizador/admin
_TRANSICIONES_VALIDAS = {
    Ponencia.Estado.POSTULADA:            {Ponencia.Estado.EN_REVISION, Ponencia.Estado.RECHAZADA, Ponencia.Estado.ACEPTADA, Ponencia.Estado.ACEPTADA_CON_CAMBIOS},
    Ponencia.Estado.EN_REVISION:          {Ponencia.Estado.ACEPTADA, Ponencia.Estado.RECHAZADA, Ponencia.Estado.ACEPTADA_CON_CAMBIOS},
    Ponencia.Estado.ACEPTADA_CON_CAMBIOS: {Ponencia.Estado.RECHAZADA},
    Ponencia.Estado.CAMBIOS_ENVIADOS:     {Ponencia.Estado.ACEPTADA, Ponencia.Estado.RECHAZADA, Ponencia.Estado.ACEPTADA_CON_CAMBIOS},
    # Aceptada y rechazada son estados finales; no se transiciona desde ellos.
}


def postular_ponencia(autor, datos, respuestas=None):
    archivo = datos.get('archivo')
    if archivo and not archivo.name.lower().endswith('.pdf'):
        raise ValidationError({'archivo': 'Solo se permiten archivos PDF.'})

    area_tematica = datos.get('area_tematica', '')
    coautores = datos.get('autores', [])

    ponencia = Ponencia.objects.create(
        autor_principal=autor,
        titulo=datos['titulo'],
        resumen=datos['resumen'],
        area_tematica=area_tematica,
        autores=coautores,
        archivo=archivo,
        estado=Ponencia.Estado.POSTULADA,
    )

    if respuestas:
        RespuestaFormulario.objects.bulk_create([
            RespuestaFormulario(
                ponencia=ponencia,
                nombre_campo=r['nombre_campo'],
                valor=r.get('valor', ''),
            )
            for r in respuestas
        ])

    return ponencia


def confirmar_pago(ponencia, referencia):

    if ponencia.pago_confirmado:
        raise ValidationError('El pago de esta ponencia ya fue confirmado anteriormente.')

    ponencia.pago_confirmado = True
    ponencia.pago_referencia = referencia
    ponencia.save(update_fields=['pago_confirmado', 'pago_referencia', 'actualizado_en'])
    return ponencia


def cambiar_estado(ponencia, nuevo_estado, usuario):
    if usuario is not None:
        user_es_admin = getattr(usuario, 'rol', '') == 'administrador'
        user_es_organizador = getattr(usuario, 'rol', '') == 'organizador'

        if not (user_es_admin or user_es_organizador):
            raise PermissionDenied('Solo el organizador o un administrador puede cambiar el estado.')

    estado_actual = ponencia.estado
    transiciones = _TRANSICIONES_VALIDAS.get(estado_actual, set())

    if nuevo_estado not in transiciones:
        raise ValidationError(
            {'nuevo_estado': f'No se puede pasar de "{estado_actual}" a "{nuevo_estado}". '
                             f'Transiciones válidas: {", ".join(transiciones) or "ninguna"}.'}
        )

    ponencia.estado = nuevo_estado
    ponencia.save(update_fields=['estado', 'actualizado_en'])
    return ponencia


def enviar_cambios(ponencia, archivo, autor):
    if ponencia.autor_principal != autor:
        raise PermissionDenied('Solo el autor principal puede enviar los cambios.')

    if ponencia.estado != Ponencia.Estado.ACEPTADA_CON_CAMBIOS:
        raise ValidationError(
            {'estado': 'Solo se pueden enviar cambios cuando el estado es "aceptada_con_cambios".'}
        )

    ponencia.archivo_revisado    = archivo
    ponencia.estado              = Ponencia.Estado.CAMBIOS_ENVIADOS
    ponencia.cambios_enviados_en = timezone.now()
    ponencia.save(update_fields=['archivo_revisado', 'estado', 'cambios_enviados_en', 'actualizado_en'])

    # Reiniciar las revisiones de los revisores activos para nuevo veredicto
    Revision.objects.filter(
        asignacion__ponencia=ponencia,
        asignacion__activo=True,
        estado=Revision.Estado.COMPLETADA,
    ).update(
        estado=Revision.Estado.PENDIENTE,
        veredicto='',
        comentario_autor='',
        comentario_privado='',
        respuestas_rubrica={},
        iniciada_en=None,
        completada_en=None,
    )
    return ponencia
