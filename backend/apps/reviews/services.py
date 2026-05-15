# apps/reviews/services.py

from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import AsignacionRevisor, Revision, Veredicto
from apps.submissions.models import Ponencia
from apps.submissions.services import cambiar_estado


def asignar_revisor(ponencia, revisor, es_desempate=False):
    """
    RF-13: asigna un revisor a una ponencia.
    Valida que no exceda el máximo y que el revisor no sea el autor.
    """
    if revisor == ponencia.autor:
        raise ValidationError("El revisor no puede ser el autor de la ponencia.")

    max_rev = ponencia.conferencia.max_revisores
    actuales = AsignacionRevisor.objects.filter(ponencia=ponencia, activo=True).count()

    if actuales >= max_rev:
        raise ValidationError(
            f"La ponencia ya tiene el máximo de {max_rev} revisores."
        )

    asignacion, creada = AsignacionRevisor.objects.get_or_create(
        ponencia=ponencia,
        revisor=revisor,
        defaults={"es_desempate": es_desempate, "activo": True},
    )

    if not creada:
        raise ValidationError("Este revisor ya está asignado a esta ponencia.")

    Revision.objects.create(asignacion=asignacion)

    # Notificar al revisor (descomentar cuando notifications esté listo)
    # from apps.notifications.services import enviar_asignacion_revisor
    # enviar_asignacion_revisor(revisor, ponencia.conferencia, ponencia)

    return asignacion


def asignar_revisores_automatico(ponencia):
    """
    RF-13: asignación automática por área temática.
    Busca revisores activos en la conferencia cuya categoría
    coincida con el área temática de la ponencia.
    """
    from apps.conferences.models import ConferenciaUsuario

    min_rev = ponencia.conferencia.min_revisores

    revisores_disponibles = (
        ConferenciaUsuario.objects.filter(
            conferencia=ponencia.conferencia,
            rol="revisor",
            activo=True,
            categoria_revisor__icontains=ponencia.area_tematica,
        )
        .exclude(usuario=ponencia.autor)
        .select_related("usuario")
    )

    asignados = 0
    for cu in revisores_disponibles[:min_rev]:
        try:
            asignar_revisor(ponencia, cu.usuario)
            asignados += 1
        except ValidationError:
            continue

    if asignados < min_rev:
        raise ValidationError(
            f"No hay suficientes revisores disponibles para el área '{ponencia.area_tematica}'."
        )

    cambiar_estado(ponencia, Ponencia.Estado.EN_REVISION, actor=None)
    return asignados


def completar_revision(
    revision, veredicto, comentario_autor, comentario_privado, respuestas_rubrica
):
    """RF-15: el revisor completa su evaluación."""
    if revision.esta_completa():
        raise ValidationError("Esta revisión ya fue completada.")

    revision.veredicto = veredicto
    revision.comentario_autor = comentario_autor
    revision.comentario_privado = comentario_privado
    revision.respuestas_rubrica = respuestas_rubrica
    revision.estado = Revision.Estado.COMPLETADA
    revision.completada_en = timezone.now()
    revision.save()

    verificar_y_emitir_veredicto(revision.asignacion.ponencia)
    return revision


def verificar_y_emitir_veredicto(ponencia):
    """
    RF-14: verifica si todas las revisiones están completas.
    Si hay empate con 2 revisores, asigna un tercero.
    Si hay mayoría, emite el veredicto final automáticamente.
    """
    asignaciones = AsignacionRevisor.objects.filter(ponencia=ponencia, activo=True)
    revisiones = [a.revision for a in asignaciones if hasattr(a, "revision")]
    completadas = [r for r in revisiones if r.esta_completa()]

    if len(completadas) < asignaciones.count():
        return None  # Aún hay revisiones pendientes

    votos = [r.veredicto for r in completadas]

    # Detectar empate entre 2 revisores
    if len(completadas) == 2 and votos[0] != votos[1]:
        _asignar_revisor_desempate(ponencia)
        return None

    # Calcular resultado por mayoría
    resultado = max(set(votos), key=votos.count)
    return emitir_veredicto_final(ponencia, resultado, completadas)


def _asignar_revisor_desempate(ponencia):
    """RF-14: busca y asigna un tercer revisor para romper el empate."""
    from apps.conferences.models import ConferenciaUsuario

    ya_asignados = AsignacionRevisor.objects.filter(
        ponencia=ponencia
    ).values_list("revisor_id", flat=True)

    candidato = (
        ConferenciaUsuario.objects.filter(
            conferencia=ponencia.conferencia,
            rol="revisor",
            activo=True,
        )
        .exclude(usuario_id__in=ya_asignados)
        .exclude(usuario=ponencia.autor)
        .first()
    )

    if not candidato:
        raise ValidationError("No hay revisores disponibles para el desempate.")

    asignar_revisor(ponencia, candidato.usuario, es_desempate=True)


def emitir_veredicto_final(ponencia, resultado, revisiones_completadas):
    """
    RF-15/18: consolida el veredicto y notifica al autor.
    El feedback es anónimo — solo se envían los comentario_autor.
    """
    feedback_anonimo = [
        r.comentario_autor for r in revisiones_completadas if r.comentario_autor
    ]

    veredicto = Veredicto.objects.create(
        ponencia=ponencia,
        emitido_por=ponencia.conferencia.organizador,
        resultado=resultado,
        resumen_para_autor=" | ".join(feedback_anonimo),
    )

    # Actualizar estado de la ponencia en submissions
    mapa_estado = {
        Veredicto.Resultado.ACEPTADO: Ponencia.Estado.ACEPTADA,
        Veredicto.Resultado.RECHAZADO: Ponencia.Estado.RECHAZADA,
        Veredicto.Resultado.ACEPTADO_CON_CAMBIOS: Ponencia.Estado.ACEPTADA_CON_CAMBIOS,
    }
    cambiar_estado(
        ponencia,
        mapa_estado[resultado],
        actor=ponencia.conferencia.organizador,
    )

    # Reembolso automático si es rechazada (RF-09)
    if veredicto.es_rechazado() and getattr(ponencia, "pago_completado", False):
        _reembolsar_ponencia(ponencia)

    # Notificar al autor (descomentar cuando notifications esté listo)
    # from apps.notifications.services import enviar_veredicto
    # enviar_veredicto(ponencia.autor, ponencia, resultado, feedback_anonimo)

    veredicto.notificado = True
    veredicto.save(update_fields=["notificado"])
    return veredicto


def _reembolsar_ponencia(ponencia):
    """RF-09: reembolso automático al rechazar una ponencia de pago."""
    from apps.payments.models import Pago
    from apps.payments.services import reembolsar_pago

    pago = Pago.objects.filter(
        referencia_tipo="Ponencia",
        referencia_id=ponencia.id,
        estado=Pago.Estado.COMPLETADO,
    ).first()

    if pago:
        reembolsar_pago(pago)