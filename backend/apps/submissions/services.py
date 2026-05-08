from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied

from .models import Ponencia, RespuestaFormulario


# Transiciones de estado permitidas para el organizador/admin
_TRANSICIONES_VALIDAS = {
    Ponencia.Estado.POSTULADA:            {Ponencia.Estado.EN_REVISION, Ponencia.Estado.RECHAZADA},
    Ponencia.Estado.EN_REVISION:          {Ponencia.Estado.ACEPTADA, Ponencia.Estado.RECHAZADA, Ponencia.Estado.ACEPTADA_CON_CAMBIOS},
    Ponencia.Estado.ACEPTADA_CON_CAMBIOS: {Ponencia.Estado.RECHAZADA},
    Ponencia.Estado.CAMBIOS_ENVIADOS:     {Ponencia.Estado.ACEPTADA, Ponencia.Estado.RECHAZADA, Ponencia.Estado.ACEPTADA_CON_CAMBIOS},
    # Aceptada y rechazada son estados finales; no se transiciona desde ellos.
}


def postular_ponencia(conferencia, autor, datos, respuestas=None):
    """
    RF-05: crea una nueva ponencia validando las reglas de la conferencia.

    Args:
        conferencia: instancia de Conferencia.
        autor: instancia de User (autor principal).
        datos: dict con campos de Ponencia (titulo, resumen, area_tematica, autores, archivo).
        respuestas: list de dicts {"nombre_campo": str, "valor": str} para el formulario personalizado.

    Returns:
        Ponencia recién creada.
    """
    if not conferencia.esta_abierta_postulacion():
        raise ValidationError('La conferencia no está abierta para postulaciones.')

    area_tematica = datos.get('area_tematica', '')
    if conferencia.areas_tematicas and area_tematica not in conferencia.areas_tematicas:
        raise ValidationError(
            {'area_tematica': f'El área "{area_tematica}" no está disponible. '
                              f'Áreas válidas: {", ".join(conferencia.areas_tematicas)}.'}
        )

    archivo = datos.get('archivo')
    if archivo and conferencia.formatos_archivo_permitidos:
        ext = archivo.name.rsplit('.', 1)[-1].lower()
        if ext not in conferencia.formatos_archivo_permitidos:
            raise ValidationError(
                {'archivo': f'Formato .{ext} no permitido. '
                            f'Formatos aceptados: {", ".join(conferencia.formatos_archivo_permitidos)}.'}
            )

    coautores = datos.get('autores', [])
    total = 1 + len(coautores)
    if total > conferencia.max_autores:
        raise ValidationError(
            {'autores': f'Se superó el máximo de {conferencia.max_autores} autores '
                        f'(autor principal + {conferencia.max_autores - 1} coautores).'}
        )

    ponencia = Ponencia.objects.create(
        conferencia=conferencia,
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
    """
    RF-10: marca el pago de una ponencia como confirmado.

    Solo aplica a conferencias de pago. La referencia es el ID de la
    transacción (Stripe o manual).
    """
    if not ponencia.conferencia.es_de_pago:
        raise ValidationError('Esta conferencia no requiere pago de inscripción.')

    if ponencia.pago_confirmado:
        raise ValidationError('El pago de esta ponencia ya fue confirmado anteriormente.')

    ponencia.pago_confirmado = True
    ponencia.pago_referencia = referencia
    ponencia.save(update_fields=['pago_confirmado', 'pago_referencia', 'actualizado_en'])
    return ponencia


def cambiar_estado(ponencia, nuevo_estado, usuario):
    """
    Cambia el estado de una ponencia. Solo organizador o admin pueden hacerlo.

    Valida que la transición sea permitida según el flujo definido.
    """
    user_es_admin = getattr(usuario, 'rol', '') == 'administrador'
    es_organizador = ponencia.conferencia.organizador == usuario

    if not (user_es_admin or es_organizador):
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
    """
    RF-16: el autor reenvía el paper corregido tras recibir 'aceptada_con_cambios'.

    Valida que el estado sea el correcto, que quien envía sea el autor principal
    y que no haya vencido la fecha límite de cambios de la conferencia.
    """
    if ponencia.autor_principal != autor:
        raise PermissionDenied('Solo el autor principal puede enviar los cambios.')

    if ponencia.estado != Ponencia.Estado.ACEPTADA_CON_CAMBIOS:
        raise ValidationError(
            {'estado': 'Solo se pueden enviar cambios cuando el estado es "aceptada_con_cambios".'}
        )

    fecha_limite = ponencia.conferencia.fecha_limite_cambios
    if fecha_limite and timezone.now().date() > fecha_limite:
        raise ValidationError(
            {'archivo': f'El plazo para enviar cambios venció el {fecha_limite}.'}
        )

    conferencia = ponencia.conferencia
    if archivo and conferencia.formatos_archivo_permitidos:
        ext = archivo.name.rsplit('.', 1)[-1].lower()
        if ext not in conferencia.formatos_archivo_permitidos:
            raise ValidationError(
                {'archivo': f'Formato .{ext} no permitido. '
                            f'Formatos aceptados: {", ".join(conferencia.formatos_archivo_permitidos)}.'}
            )

    ponencia.archivo_revisado    = archivo
    ponencia.estado              = Ponencia.Estado.CAMBIOS_ENVIADOS
    ponencia.cambios_enviados_en = timezone.now()
    ponencia.save(update_fields=['archivo_revisado', 'estado', 'cambios_enviados_en', 'actualizado_en'])
    return ponencia
